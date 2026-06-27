"""
Seed source: OpenStreetMap via the Overpass API. Free, no key, India-wide.

For each target city we build one Overpass query that pulls every node/way
matching any of our vertical tag filters inside that city's administrative
boundary, then map the raw OSM tags onto mello's Lead schema.
"""

import json
import time
import urllib.parse
import urllib.request

from config import (
    OVERPASS_URL, OVERPASS_TIMEOUT, HTTP_TIMEOUT, USER_AGENT, VERTICALS,
)
from db import Lead

# Public Overpass mirrors. We try them in order — the shared servers return
# 504 (Gateway Timeout) or 429 (Too Many Requests) under load, so a fallback
# matters more than raw speed.
OVERPASS_MIRRORS = [
    OVERPASS_URL,
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


def _tag_filters():
    """Collapse every vertical into a deduped {osm_key: regex} map.

    Different verticals can target the same key (e.g. several use 'amenity');
    we OR their value-regexes together so the Overpass query stays compact.
    """
    by_key = {}
    for tags in VERTICALS.values():
        for key, val_regex in tags.items():
            by_key.setdefault(key, set()).add(val_regex)
    return {k: "|".join(sorted(v)) for k, v in by_key.items()}


NOMINATIM = "https://nominatim.openstreetmap.org/search"


def resolve_area_id(city: str):
    """Resolve a city name to its OSM area id via Nominatim.

    Name-only Overpass area matching is fragile (e.g. Mumbai's boundary isn't
    named exactly "Mumbai"). Nominatim returns the right boundary relation;
    Overpass area id = 3600000000 + relation id.
    """
    try:
        url = NOMINATIM + "?" + urllib.parse.urlencode({
            "q": f"{city}, India", "format": "json", "limit": 3,
        })
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            data = json.loads(resp.read().decode("utf-8", "replace"))
        for item in data:
            if item.get("osm_type") == "relation":
                return 3_600_000_000 + int(item["osm_id"])
    except Exception:
        pass
    return None


def build_query(city: str) -> str:
    filters = _tag_filters()
    selectors = []
    for key, val_regex in filters.items():
        # nwr = node|way|relation in one statement (lighter than separate lines);
        # 'out center' later gives ways/relations a representative point.
        selectors.append(f'  nwr["{key}"~"{val_regex}"](area.searchArea);')
    body = "\n".join(selectors)

    area_id = resolve_area_id(city)
    if area_id:
        area_stmt = f"area({area_id})->.searchArea;"
    else:  # fallback: best-effort name match
        area_stmt = (f'area["name"="{city}"]["boundary"="administrative"]'
                     f"->.searchArea;")
    return (
        f"[out:json][timeout:{OVERPASS_TIMEOUT}];\n"
        f"{area_stmt}\n"
        f"(\n{body}\n);\n"
        f"out center tags;\n"
    )


def _classify(tags: dict) -> str:
    """Map raw OSM tags back to the best-matching mello vertical."""
    for category, filt in VERTICALS.items():
        for key, val_regex in filt.items():
            v = tags.get(key)
            if v is None:
                continue
            if val_regex == ".*":
                return category
            for option in val_regex.split("|"):
                if option and option in v:
                    return category
    return "other"


def _raw_type(tags: dict) -> str:
    for key in ("leisure", "amenity", "shop", "sport", "tourism", "healthcare", "club"):
        if tags.get(key):
            return f"{key}={tags[key]}"
    return ""


def _build_address(tags: dict) -> str:
    parts = []
    for k in ("addr:housenumber", "addr:street", "addr:suburb",
              "addr:city", "addr:postcode"):
        if tags.get(k):
            parts.append(tags[k])
    return ", ".join(parts)


def _element_to_lead(el: dict, city: str) -> Lead:
    tags = el.get("tags", {}) or {}
    osm_type = el.get("type")
    osm_id = el.get("id")

    lat = el.get("lat")
    lon = el.get("lon")
    if lat is None and "center" in el:           # ways carry a computed center
        lat = el["center"].get("lat")
        lon = el["center"].get("lon")

    return Lead(
        id=f"osm:{osm_type}/{osm_id}",
        source="osm",
        name=tags.get("name", "") or tags.get("name:en", ""),
        category=_classify(tags),
        raw_type=_raw_type(tags),
        phone=tags.get("phone", "") or tags.get("contact:phone", ""),
        website=tags.get("website", "") or tags.get("contact:website", ""),
        email=tags.get("email", "") or tags.get("contact:email", ""),
        instagram=tags.get("contact:instagram", "") or tags.get("instagram", ""),
        facebook=tags.get("contact:facebook", "") or tags.get("facebook", ""),
        address=_build_address(tags),
        city=tags.get("addr:city", "") or city,
        state=tags.get("addr:state", ""),
        lat=lat,
        lon=lon,
    )


def _run_overpass(query: str):
    """POST the query, trying each mirror with one retry before giving up."""
    data = urllib.parse.urlencode({"data": query}).encode()
    last_err = None
    for endpoint in OVERPASS_MIRRORS:
        for attempt in (1, 2):
            try:
                req = urllib.request.Request(
                    endpoint, data=data, headers={"User-Agent": USER_AGENT}
                )
                with urllib.request.urlopen(req, timeout=OVERPASS_TIMEOUT + 30) as resp:
                    return json.loads(resp.read().decode("utf-8", "replace"))
            except Exception as e:
                last_err = e
                code = getattr(e, "code", None)
                print(f"    overpass {endpoint.split('/')[2]} "
                      f"attempt {attempt} failed ({code or type(e).__name__})")
                if attempt == 1:
                    time.sleep(8)  # transient 504/429 — back off then retry
    raise last_err


def fetch_city(city: str):
    """Run the Overpass query for one city, return a list[Lead] (named only)."""
    query = build_query(city)
    payload = _run_overpass(query)

    leads = []
    seen = set()
    for el in payload.get("elements", []):
        tags = el.get("tags", {}) or {}
        if not tags.get("name") and not tags.get("name:en"):
            continue  # unnamed POIs are useless as leads
        lead = _element_to_lead(el, city)
        if lead.id in seen:
            continue
        seen.add(lead.id)
        leads.append(lead)
    return leads


def seed(cities, sleep_between: float = 4.0):
    """Seed all cities. Yields (city, list[Lead]). Polite pause between calls.

    Resilient: if one city fails on every mirror, we log it and yield an empty
    list so the rest of the sweep still completes.
    """
    for i, city in enumerate(cities):
        if i > 0:
            time.sleep(sleep_between)  # be kind to the shared Overpass server
        try:
            yield city, fetch_city(city)
        except Exception as e:
            print(f"  ! {city}: giving up ({getattr(e, 'code', None) or type(e).__name__})")
            yield city, []
