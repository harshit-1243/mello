"""
mello-fit scoring (0-100): how good a lead is for an AI voice receptionist.

The big levers: can we reach them (phone), are they an established place
(website/social), are they a core booking-driven vertical, and — the
"high-traffic" signal you asked for — how many Google reviews they have.
"""

from config import SCORE_WEIGHTS as W, HIGH_FIT_CATEGORIES
from db import Lead, all_leads, upsert


def score_lead(row: dict) -> int:
    s = 0
    if row.get("phone"):
        s += W["has_phone"]
    if row.get("website"):
        s += W["has_website"]
    if row.get("instagram") or row.get("facebook"):
        s += W["has_social"]

    rating = row.get("rating")
    if rating is not None and rating >= 4.0:
        s += W["rating_good"]

    if row.get("category") in HIGH_FIT_CATEGORIES:
        s += W["category_high"]
    else:
        s += W["category_med"]

    rc = row.get("review_count")
    if rc is None:
        s += W["reviews_unknown"]
    elif rc >= 500:
        s += W["reviews_500"]
    elif rc >= 100:
        s += W["reviews_100"]
    elif rc >= 20:
        s += W["reviews_20"]
    else:
        s += W["reviews_low"]

    return min(s, 100)


def score_all():
    leads = all_leads()
    for row in leads:
        s = score_lead(row)
        upsert(Lead(id=row["id"], mello_fit_score=s, notes=row.get("notes", "")))
    print(f"scored {len(leads)} leads")
