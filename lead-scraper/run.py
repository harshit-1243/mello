"""
mello lead-scraper CLI.

Builds a lead list of high-footfall, phone-driven local businesses in India
(gyms, turfs, clubs, gymkhanas, salons, spas, clinics, dentists, hotels …)
for pitching mello, the AI voice receptionist.

Phases (run in order, or all at once with `full`):
    seed     pull named places from OpenStreetMap for the target cities
    website  scrape email + socials from each lead's homepage (free)
    google   fill phone + rating + review_count via Google Places (needs key)
    score    compute mello-fit score (0-100)
    export   write ranked CSV / JSONL

Examples (PowerShell, from the lead-scraper/ folder):
    python run.py seed --cities "Mumbai,Navi Mumbai"
    python run.py website --limit 50
    python run.py google
    python run.py score
    python run.py export --format csv
    python run.py full --cities "Mumbai"        # seed -> website -> score -> export
    python run.py stats
"""

import argparse
import sys

import db
from config import DEFAULT_CITIES


def _cities(arg):
    if not arg:
        return DEFAULT_CITIES
    return [c.strip() for c in arg.split(",") if c.strip()]


def do_seed(cities):
    import sources
    db.init_db()
    grand = 0
    for city, leads in sources.seed(cities):
        ins = mrg = 0
        for lead in leads:
            if db.upsert(lead) == "insert":
                ins += 1
            else:
                mrg += 1
        grand += len(leads)
        print(f"  {city:14s} {len(leads):5d} places  (+{ins} new, ~{mrg} merged)")
    print(f"seed complete: {grand} places across {len(cities)} cities")


def do_stats():
    s = db.stats()
    print(f"\n  total leads      {s['total']}")
    print(f"  with phone       {s['with_phone']}")
    print(f"  with website     {s['with_website']}")
    print("\n  by category:")
    for cat, n in s["by_category"]:
        print(f"    {cat or '?':16s} {n}")
    print("\n  by city:")
    for city, n in s["by_city"]:
        print(f"    {city:16s} {n}")
    print()


def main():
    p = argparse.ArgumentParser(description="mello lead-scraper")
    p.add_argument("phase", choices=[
        "seed", "website", "discover", "google", "score", "export", "full", "stats",
    ])
    p.add_argument("--cities", default="", help="comma-separated, defaults to config")
    p.add_argument("--limit", type=int, default=None, help="cap enrichment requests")
    p.add_argument("--format", default="csv", choices=["csv", "jsonl"])
    args = p.parse_args()

    # Windows consoles default to cp1252; business names carry ₹, em-dashes,
    # Devanagari, etc. Force UTF-8 so a print never crashes the run.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    db.init_db()
    cities = _cities(args.cities)

    if args.phase == "seed":
        do_seed(cities)
    elif args.phase == "website":
        import enrich
        enrich.enrich_website(limit=args.limit)
    elif args.phase == "discover":
        import enrich
        enrich.discover(limit=args.limit or 400)
    elif args.phase == "google":
        import enrich
        enrich.enrich_google(limit=args.limit)
    elif args.phase == "score":
        import score
        score.score_all()
    elif args.phase == "export":
        import export
        export.export(args.format)
    elif args.phase == "stats":
        do_stats()
    elif args.phase == "full":
        import enrich, score, export
        do_seed(cities)
        score.score_all()                      # score first so discover can prioritise
        enrich.enrich_website(limit=args.limit)
        enrich.discover(limit=300)             # capped: slowest + rate-limit-prone phase
        enrich.enrich_google(limit=args.limit)  # no-op without a key
        score.score_all()                      # re-score with the new phones
        export.export(args.format)
        do_stats()


if __name__ == "__main__":
    sys.exit(main())
