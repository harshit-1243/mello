"""
Enrichment — the part that actually GETS THE PHONE NUMBERS.

mello can't pitch a lead it can't call, so this module hunts a number from
several sources, in order, and stops at the first good one:

    1. OSM            already on the lead from `seed` (kept).
    2. website        the business's own homepage + /contact pages (free).
    3. web search     for leads with no website, find one (or a directory
                      listing) via DuckDuckGo, then scrape that for a number.
    4. google         Google Places by name+city — phone + rating + reviews.
                      Best quality, but needs GOOGLE_PLACES_API_KEY (paid).

All free phases run concurrently (thread pool) so a few-thousand-lead sweep
finishes in minutes, not hours.
"""

import json
import re
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

from config import HTTP_TIMEOUT, USER_AGENT, GOOGLE_PLACES_API_KEY
from db import Lead, all_leads, upsert

# ── regexes ──────────────────────────────────────────────────────────────────
EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
INSTA_RE = re.compile(r"https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.]+/?")
FB_RE = re.compile(r"https?://(?:www\.)?facebook\.com/[A-Za-z0-9_.\-/]+")
TEL_RE = re.compile(r'tel:(\+?[0-9][0-9\-\s().]{7,17})', re.I)
# Free-text candidates: restrict to Indian MOBILES (start 6-9, 10 digits, with
# optional +91/0 prefix and separators). Landlines are only trusted from tel:
# links. This kills the false positives that plague search-result HTML.
PHONE_CAND_RE = re.compile(
    r'(?:\+?91[\s\-.]?|0)?[6-9](?:[\s\-.]?\d){9}'
)

_JUNK_EMAIL = re.compile(r"(sentry|example\.com|\.png|\.jpg|@sentry|wixpress|godaddy|@2x)", re.I)
_JUNK_SOCIAL = re.compile(r"/(sharer|share|intent|login|tr\?|plugins|dialog)", re.I)

CONTACT_PATHS = ["", "/contact", "/contact-us", "/contactus", "/contact.html", "/about"]

# directory/aggregator domains: useful to scrape a number FROM, but never store
# as the business's own "website".
_AGGREGATORS = re.compile(
    r"(justdial|sulekha|indiamart|tradeindia|yellowpages|asklaila|grotal|"
    r"facebook|instagram|twitter|linkedin|youtube|practo|zomato|swiggy|"
    r"google\.|maps\.|tripadvisor|makemytrip|goibibo|yatra)", re.I)


# ── phone normalization / validation ─────────────────────────────────────────
def normalize_in_phone(raw):
    """Return a clean Indian number as '+91 XXXXXXXXXX' / '+91 22 XXXXXXXX', else None."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00"):
        digits = digits[2:]
    if len(digits) >= 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    # toll-free
    if digits.startswith(("1800", "1860")) and 10 <= len(digits) <= 11:
        return digits
    if len(digits) == 10:
        if digits[0] in "6789":                 # mobile
            return "+91 " + digits
        if digits[0] in "234":                  # metro landline w/o trunk 0
            return "+91 " + digits
    return None


def extract_phones(html):
    """Pull every plausible Indian number out of a page, deduped, best-first."""
    found = []
    seen = set()
    # tel: links first — highest precision
    for m in TEL_RE.findall(html):
        n = normalize_in_phone(m)
        if n and n not in seen:
            seen.add(n)
            found.append(n)
    # then visible-text candidates
    for m in PHONE_CAND_RE.findall(html):
        n = normalize_in_phone(m)
        if n and n not in seen:
            seen.add(n)
            found.append(n)
    return found


# ── http ─────────────────────────────────────────────────────────────────────
def _get(url, timeout=HTTP_TIMEOUT, cap=600_000):
    if not url.startswith("http"):
        url = "http://" + url
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read(cap).decode("utf-8", "replace")


def _first_clean(matches, junk_re):
    for m in matches:
        if not junk_re.search(m):
            return m.rstrip("/")
    return ""


def _scrape_site(base_url):
    """Visit a few pages of one site; return {phone,email,instagram,facebook}."""
    out = {"phone": "", "email": "", "instagram": "", "facebook": ""}
    base = base_url.rstrip("/")
    for path in CONTACT_PATHS:
        try:
            html = _get(base + path)
        except Exception:
            continue
        if not out["phone"]:
            phones = extract_phones(html)
            if phones:
                out["phone"] = phones[0]
        if not out["email"]:
            out["email"] = _first_clean(EMAIL_RE.findall(html), _JUNK_EMAIL)
        if not out["instagram"]:
            out["instagram"] = _first_clean(INSTA_RE.findall(html), _JUNK_SOCIAL)
        if not out["facebook"]:
            out["facebook"] = _first_clean(FB_RE.findall(html), _JUNK_SOCIAL)
        if out["phone"] and out["email"]:
            break       # got the important bits, stop crawling this site
    return out


# ── web-search discovery (for leads with no website) ─────────────────────────
# DuckDuckGo blocks automated requests; Bing & Mojeek tolerate scraping.
# Strategy: use Mojeek for clean result LINKS (scrape the real page for a
# number — high precision), and Bing as a fallback whose results HTML often
# prints the phone directly in the snippet.
_BING = "https://www.bing.com/search"
_MOJEEK = "https://www.mojeek.com/search"
_BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
               "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def _search_html(engine_url, query):
    url = engine_url + "?" + urllib.parse.urlencode({"q": query, "cc": "in"})
    req = urllib.request.Request(url, headers={
        "User-Agent": _BROWSER_UA,
        "Accept-Language": "en-IN,en;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
        return resp.read(900_000).decode("utf-8", "replace")


def _mojeek_links(query, limit=4):
    try:
        html = _search_html(_MOJEEK, query)
    except Exception:
        return []
    links = []
    # Mojeek organic results are <a class="title" ... href="URL">
    for href in re.findall(r'<a class="title"[^>]+href="(https?://[^"]+)"', html):
        href = href.split("#")[0]
        if href not in links:
            links.append(href)
        if len(links) >= limit:
            break
    return links


def _bing_snippet_phone(query):
    """Most-frequent valid Indian number in Bing's results HTML (repeated =
    likely the real listed number)."""
    try:
        html = _search_html(_BING, query + " contact phone number")
    except Exception:
        return ""
    counts = {}
    for raw in TEL_RE.findall(html) + PHONE_CAND_RE.findall(html):
        n = normalize_in_phone(raw)
        if n:
            counts[n] = counts.get(n, 0) + 1
    if not counts:
        return ""
    best, n = max(counts.items(), key=lambda kv: kv[1])
    return best if n >= 2 else ""    # a single hit is probably noise


def _discover_one(row):
    """No-website lead: find the official site + a phone via web search."""
    query = f"{row['name']} {row.get('city') or ''}".strip()
    out = {"phone": "", "website": "", "email": "", "instagram": "", "facebook": ""}

    # 1) scrape the top real result pages (highest precision)
    for link in _mojeek_links(query + " contact"):
        try:
            html = _get(link)
        except Exception:
            continue
        if not out["phone"]:
            phones = extract_phones(html)
            if phones:
                out["phone"] = phones[0]
        if not out["website"] and not _AGGREGATORS.search(link):
            out["website"] = link.split("?")[0]
        if out["phone"]:
            break

    # 2) fallback: take the number Bing prints in its snippets
    if not out["phone"]:
        p = _bing_snippet_phone(query)
        if p:
            out["phone"] = p
            out["notes"] = "phone via web-search snippet — verify on call"
    return out


# ── public phases ─────────────────────────────────────────────────────────────
def _run_pool(rows, worker, label, workers=10):
    """Run `worker(row)->dict` over rows concurrently; upsert results serially."""
    enriched = 0
    done = 0
    total = len(rows)
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(worker, r): r for r in rows}
        for fut in as_completed(futs):
            row = futs[fut]
            done += 1
            try:
                data = fut.result()
            except Exception:
                data = None
            if data and any(data.values()):
                fields = {k: v for k, v in data.items() if v}
                upsert(Lead(id=row["id"], **fields))
                if data.get("phone"):
                    enriched += 1
                    print(f"  [{done}/{total}] +{data['phone']:<18} {row['name'][:38]}")
            if done % 50 == 0:
                print(f"  ... {label}: {done}/{total} processed, {enriched} new phones")
    print(f"{label}: processed {total}, found {enriched} new phone numbers")


def normalize_all_phones():
    """Rewrite every stored phone into clean '+91 …' form (OSM tags are raw).
    Leaves a number untouched if it doesn't look like a valid Indian number."""
    fixed = 0
    for row in all_leads():
        raw = (row.get("phone") or "").strip()
        if not raw:
            continue
        n = normalize_in_phone(raw)
        if n and n != raw:
            upsert(Lead(id=row["id"], phone=n))
            fixed += 1
    print(f"normalized {fixed} phone numbers")


def enrich_website(limit=None, workers=10):
    """Scrape phone/email/socials from each lead's own website (concurrent)."""
    rows = [r for r in all_leads() if r.get("website") and not r.get("phone")]
    if limit:
        rows = rows[:limit]
    print(f"website enrichment: {len(rows)} leads with a website but no phone")
    _run_pool(rows, _scrape_site, "website", workers)


def discover(limit=400, workers=8):
    """Web-search leads that have NO website to dig up a number elsewhere."""
    rows = [r for r in all_leads() if not r.get("phone") and not r.get("website")]
    # prioritise the better-fit verticals so we spend searches where they matter
    rows.sort(key=lambda r: r.get("mello_fit_score", 0), reverse=True)
    if limit:
        rows = rows[:limit]
    print(f"web-search discovery: {len(rows)} no-website leads to chase")
    _run_pool(rows, _discover_one, "discover", workers)


# ── Google Places API (New) — optional, paid ─────────────────────────────────
# One Text Search call per lead returns phone + rating + reviews + website,
# which is cheaper than the legacy search+details two-call pattern.
_PLACES_NEW = "https://places.googleapis.com/v1/places:searchText"
_PLACES_FIELDS = ("places.displayName,places.nationalPhoneNumber,"
                  "places.internationalPhoneNumber,places.rating,"
                  "places.userRatingCount,places.websiteUri")

# Spend the paid budget on the businesses that most need a voice booking agent.
# Tier 1 = slot/turf/court/class booking (highest intent); Tier 2 = appointment
# based; everything else (pharmacy, hospital, hotel, coworking…) comes last.
_HOME_MARKET = {"mumbai", "navi mumbai", "thane"}
_TIER1 = {"turf", "sports_centre", "club", "gym", "studio"}
_TIER2 = {"salon", "spa", "dentist", "clinic"}


def _google_search_text(query):
    body = json.dumps({"textQuery": query, "regionCode": "IN"}).encode()
    req = urllib.request.Request(_PLACES_NEW, data=body, headers={
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": _PLACES_FIELDS,
        "User-Agent": USER_AGENT,
    })
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
        return json.loads(resp.read().decode("utf-8", "replace"))


def _priority(row):
    cat = row.get("category", "")
    tier = 0 if cat in _TIER1 else 1 if cat in _TIER2 else 2
    home = 0 if (row.get("city") or "").strip().lower() in _HOME_MARKET else 1
    # vertical first, then Mumbai-first within the vertical, then best fit
    return (tier, home, -row.get("mello_fit_score", 0))


def enrich_google(limit=None, only_missing=True):
    if not GOOGLE_PLACES_API_KEY:
        print("GOOGLE_PLACES_API_KEY not set — skipping Google enrichment.")
        print("Set it (env var) to add verified phones + review counts.")
        return

    rows = all_leads()
    if only_missing:
        rows = [r for r in rows if not r.get("phone")]
    rows.sort(key=_priority)                       # home market + best fit first
    if limit:
        rows = rows[:limit]

    print(f"google enrichment: {len(rows)} leads queued "
          f"(home-market + high-fit first), ~${len(rows) * 0.04:.0f} est. cost")
    done = found = 0
    for row in rows:
        done += 1
        query = f"{row['name']} {row.get('city') or ''}".strip()
        try:
            places = _google_search_text(query).get("places", [])
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", "replace")[:200]
            if e.code in (401, 403):              # bad key / billing / API disabled
                print(f"\nSTOP: Google rejected the request ({e.code}). {detail}")
                print("Check the key, that billing is on, and 'Places API (New)' "
                      "is enabled. No further calls made.")
                break
            print(f"  ! {row['name'][:36]:36s} HTTP {e.code}")
            continue
        except Exception as e:
            print(f"  ! {row['name'][:36]:36s} {type(e).__name__}")
            continue

        if not places:
            continue
        p = places[0]
        phone = (p.get("nationalPhoneNumber") or p.get("internationalPhoneNumber") or "")
        try:
            upsert(Lead(
                id=row["id"], source="google",
                phone=normalize_in_phone(phone) or phone,
                website=p.get("websiteUri", ""),
                rating=p.get("rating"),
                review_count=p.get("userRatingCount"),
            ))
        except Exception as e:
            print(f"  ! write failed {row['name'][:30]}: {type(e).__name__}")
            continue
        if phone:
            found += 1
            if found % 25 == 0:
                print(f"  ... {done}/{len(rows)} queried, {found} phones")
    print(f"google enrichment: queried {done}, added {found} verified phones")
