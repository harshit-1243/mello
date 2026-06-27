# mello lead-scraper

A zero-setup pipeline that builds a **lead list of high-footfall, phone-driven
local businesses in India** — the exact places that benefit from mello, the AI
voice receptionist. Gyms, turfs, clubs, gymkhanas, salons, spas, clinics,
dentists, hotels, hospitals — and easy to widen to any vertical.

It's the same idea as a company data-layer, pointed at mello's prospects
instead of banks: **find places → enrich them → score fit → export a call list.**

## Why these places
mello answers phones, takes bookings, and confirms over WhatsApp. The best
leads are businesses with **high walk-in/booking traffic that live on the
phone**. So we rank by a "mello-fit" score: can we reach them (phone), are they
established (website/social), are they a core booking vertical, and — the
high-traffic signal — how many Google reviews they have.

## Zero setup
Pure Python **standard library** + built-in SQLite. No `pip install`, no
database server, no API key required to start.

```powershell
cd lead-scraper

# everything at once for the default cities (Mumbai, Navi Mumbai, Thane)
python run.py full

# or step by step
python run.py seed --cities "Mumbai,Navi Mumbai"   # pull places from OpenStreetMap (free)
python run.py website --limit 100                  # scrape email + socials from homepages (free)
python run.py google                               # add phone + reviews via Google Places (needs key)
python run.py score                                # compute mello-fit score 0-100
python run.py export --format csv                  # ranked CSV in exports/
python run.py stats                                # coverage summary
```

Output lands in `exports/mello_leads_<date>.csv`, ranked best-first.

## Phases
| Phase | Source | Cost | Fills |
|---|---|---|---|
| `seed` | OpenStreetMap (Overpass API) | **free** | name, category, address, lat/lon, some phone/website |
| `website` | each lead's own homepage | **free** | email, instagram, facebook |
| `google` | Google Places API | needs key (billing) | **phone**, rating, **review_count** (traffic signal) |
| `score` | local | free | `mello_fit_score` 0–100 |
| `export` | local | free | ranked CSV / JSONL |

## ⚠️ The phone-number gap (read this)
OpenStreetMap is great for *finding* places and their category, but in India
its **phone-number coverage is thin** (often <10%). A lead list you can't call
isn't much use — so for a real outreach list, turn on **Google Places**:

```powershell
$env:GOOGLE_PLACES_API_KEY = "AIza..."   # then re-run
python run.py google
python run.py score
python run.py export
```

Google Places fills the phone number and the review count (your "high-traffic"
proxy) for most named places. It's pay-as-you-go; the `--limit` flag caps how
many lookups you spend per run.

## Adding / widening verticals
Everything is in [`config.py`](config.py):
- **`VERTICALS`** — each mello category maps to OpenStreetMap tag filters
  (`key -> value-regex`). Add a key, or add `|values` to a regex, to widen.
- **`DEFAULT_CITIES`** — any city OSM knows by name.
- **`SCORE_WEIGHTS`** / **`HIGH_FIT_CATEGORIES`** — tune what "good lead" means.

## Files
```
config.py     verticals, cities, scoring weights, API key
sources.py    OpenStreetMap / Overpass seeding (with mirror fallback + retry)
enrich.py     website scrape (free) + Google Places (optional)
score.py      mello-fit scoring
db.py         SQLite store, merge-upsert (blank never clobbers a real value)
export.py     ranked CSV / JSONL
run.py        CLI
```

## Notes
- Re-runnable and **idempotent** — re-seeding merges, never duplicates; later
  phases only fill blanks, so quality climbs across runs.
- Overpass is a shared free server; the scraper tries 3 mirrors with back-off.
  If all are busy (504/429), wait a minute and re-run `seed`.
- `leads.db` and `exports/` are gitignored (generated data, not source).
