"""Export the lead list to CSV / JSONL, ranked by mello-fit score."""

import csv
import json
import os
import re
from datetime import date

from config import EXPORT_DIR
from db import all_leads

_FIELDS = [
    "mello_fit_score", "name", "category", "phone", "website", "email",
    "instagram", "facebook", "address", "city", "state",
    "rating", "review_count", "source", "raw_type", "lat", "lon", "id",
]


def _quality(r):
    """Higher = a more complete/useful record — used to pick the survivor."""
    return (
        r.get("mello_fit_score", 0),
        r.get("review_count") or 0,
        bool(r.get("website")),
        bool(r.get("email")),
        len(r.get("name") or ""),
    )


def _dedupe(rows):
    """Collapse duplicates. Same phone number => same contact (OSM often has
    the same venue as several nodes). Phone-less rows fall back to name+city.
    Keeps the highest-quality record per key, preserving rank order."""
    best, order = {}, []
    for r in rows:
        phone_digits = re.sub(r"\D", "", (r.get("phone") or ""))
        if phone_digits:
            key = ("phone", phone_digits)
        else:
            key = ("nc", (r.get("name") or "").strip().lower(),
                   (r.get("city") or "").strip().lower())
        if key not in best:
            best[key] = r
            order.append(key)
        elif _quality(r) > _quality(best[key]):
            best[key] = r
    return [best[k] for k in order]


# metro centroids (lat, lon) — leads are bucketed to the nearest one so that
# suburb-level addr:city values (Vashi, Andheri…) still land in the right metro
_METROS = {
    "Mumbai": (19.076, 72.877), "Navi Mumbai": (19.033, 73.029),
    "Thane": (19.218, 72.978), "Pune": (18.520, 73.856),
    "Bengaluru": (12.972, 77.594), "Hyderabad": (17.385, 78.486),
    "Chennai": (13.083, 80.270), "Delhi": (28.704, 77.102),
    "Gurugram": (28.459, 77.026), "Noida": (28.535, 77.391),
    "Kolkata": (22.573, 88.364), "Ahmedabad": (23.023, 72.571),
    "Jaipur": (26.912, 75.787),
}


def _metro_for(r):
    lat, lon = r.get("lat"), r.get("lon")
    if lat is None or lon is None:
        return (r.get("city") or "Other").strip() or "Other"
    best, bestd = "Other", 1.0  # ~110 km cutoff before calling it "Other"
    for name, (mlat, mlon) in _METROS.items():
        d = (lat - mlat) ** 2 + (lon - mlon) ** 2
        if d < bestd:
            best, bestd = name, d
    return best


def export_by_city(dedupe=True):
    """Write one callable CSV per metro into exports/by_city/."""
    os.makedirs(EXPORT_DIR, exist_ok=True)
    out_dir = os.path.join(EXPORT_DIR, "by_city")
    os.makedirs(out_dir, exist_ok=True)
    leads = [r for r in all_leads(order_by_score=True)
             if (r.get("phone") or "").strip()]
    if dedupe:
        leads = _dedupe(leads)

    buckets = {}
    for r in leads:
        buckets.setdefault(_metro_for(r), []).append(r)

    print(f"splitting {len(leads)} callable leads into {len(buckets)} cities:")
    for city in sorted(buckets, key=lambda c: -len(buckets[c])):
        safe = re.sub(r"[^A-Za-z0-9]+", "_", city).strip("_") or "Other"
        path = os.path.join(out_dir, f"{safe}.csv")
        with open(path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=_FIELDS, extrasaction="ignore")
            w.writeheader()
            for row in buckets[city]:
                w.writerow(row)
        print(f"   {city:<14} {len(buckets[city]):>4}  -> by_city/{safe}.csv")
    return out_dir


def export(fmt="csv", phone_only=False, dedupe=False):
    os.makedirs(EXPORT_DIR, exist_ok=True)
    leads = all_leads(order_by_score=True)
    if phone_only:
        leads = [r for r in leads if (r.get("phone") or "").strip()]
    if dedupe:
        leads = _dedupe(leads)
    stamp = date.today().isoformat()
    tag = "callable" if phone_only else "all"

    if fmt == "jsonl":
        path = os.path.join(EXPORT_DIR, f"mello_leads_{tag}_{stamp}.jsonl")
        with open(path, "w", encoding="utf-8") as f:
            for row in leads:
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
    else:
        path = os.path.join(EXPORT_DIR, f"mello_leads_{tag}_{stamp}.csv")
        with open(path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=_FIELDS, extrasaction="ignore")
            w.writeheader()
            for row in leads:
                w.writerow(row)

    print(f"exported {len(leads)} leads ({tag}) -> {path}")
    return path
