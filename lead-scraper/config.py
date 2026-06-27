"""
Configuration for the mello lead-scraper.

mello sells an AI voice receptionist to high-footfall, phone-heavy local
businesses in India. This scraper builds a lead list of exactly those places.

Everything tunable lives here: which verticals we hunt, which cities, how we
score "fit for mello", and (optional) the Google Places key.
"""

import os

# ──────────────────────────────────────────────────────────────────────────
# Target cities. mello's market is Mumbai / Navi Mumbai first (see HANDOFF).
# Add any city name OpenStreetMap knows. Names are matched against OSM
# administrative boundaries, so use the common English name.
# ──────────────────────────────────────────────────────────────────────────
DEFAULT_CITIES = [
    # Home market first (HANDOFF: Mumbai / Navi Mumbai)
    "Mumbai", "Navi Mumbai", "Thane",
    # Then the rest of the high-density metros
    "Pune", "Bengaluru", "Hyderabad", "Chennai",
    "Delhi", "Gurugram", "Noida", "Kolkata", "Ahmedabad", "Jaipur",
]

# ──────────────────────────────────────────────────────────────────────────
# Verticals. Each mello category maps to a set of OpenStreetMap tag filters
# (key -> regex of values). "Be as open as possible" — any high-traffic,
# appointment/booking-driven place that takes phone calls is a lead.
#
# To add a vertical: add an entry here. To widen one: add tag values to the
# regex. Nothing else needs to change.
# ──────────────────────────────────────────────────────────────────────────
VERTICALS = {
    "gym": {
        "leisure": "fitness_centre|fitness_station",
        "amenity": "gym",
        "sport": "fitness|crossfit|martial_arts|boxing",
    },
    "studio": {  # yoga / dance / pilates / martial-arts studios
        "leisure": "dance",
        "sport": "yoga|dance|pilates|gymnastics",
        "amenity": "dancing_school",
    },
    "turf": {
        "leisure": "pitch|track",
        "sport": "soccer|cricket|tennis|basketball|badminton|futsal|multi|table_tennis|squash",
    },
    "sports_centre": {
        "leisure": "sports_centre|sports_hall|swimming_pool",
    },
    "club": {
        "leisure": "club",
        "club": ".*",
        "amenity": "social_centre|community_centre",
    },
    "salon": {
        "shop": "hairdresser|beauty|tattoo",
        "beauty": ".*",
    },
    "spa": {
        "leisure": "spa",
        "amenity": "spa",
        "shop": "massage",
    },
    "clinic": {
        "amenity": "clinic|doctors",
        "healthcare": "clinic|centre|doctor|physiotherapist|alternative",
    },
    "dentist": {
        "amenity": "dentist",
        "healthcare": "dentist",
    },
    "diagnostic_lab": {
        "healthcare": "laboratory|sample_collection",
    },
    "veterinary": {
        "amenity": "veterinary",
    },
    "optician": {
        "shop": "optician",
    },
    "pharmacy": {
        "amenity": "pharmacy",
        "healthcare": "pharmacy",
    },
    "hospital": {
        "amenity": "hospital",
        "healthcare": "hospital",
    },
    "hotel": {
        "tourism": "hotel|resort|guest_house",
    },
    "banquet": {
        "amenity": "events_venue|conference_centre",
    },
    "coworking": {
        "office": "coworking",
        "amenity": "coworking_space",
    },
    "education": {  # appointment-driven institutes, not regular schools
        "amenity": "language_school|music_school|driving_school|prep_school",
    },
    # NOTE: restaurants/cafes are high-traffic too but would 10x the volume and
    # dominate the list. To include them, uncomment:
    # "restaurant": {"amenity": "restaurant|cafe|fast_food|bar|pub"},
}

# ──────────────────────────────────────────────────────────────────────────
# Scoring — "mello-fit" (0-100). We rank leads by how well they fit the
# product: a high-traffic place that takes phone bookings and that we can
# actually reach.
# ──────────────────────────────────────────────────────────────────────────
SCORE_WEIGHTS = {
    "has_phone": 30,        # can't pitch / they can't use a receptionist without a phone line
    "has_website": 10,      # signals an established business
    "has_social": 5,        # instagram/facebook presence
    "rating_good": 5,       # Google rating >= 4.0 (needs Google enrichment)
    # category fit
    "category_high": 25,    # core verticals (gym/turf/club/salon/spa/clinic/dentist)
    "category_med": 10,     # adjacent (hotel/hospital/other)
    # review_count = traffic proxy (needs Google enrichment)
    "reviews_500": 25,
    "reviews_100": 18,
    "reviews_20": 10,
    "reviews_low": 3,
    "reviews_unknown": 5,   # neutral when we have no Google data
}

HIGH_FIT_CATEGORIES = {
    "gym", "studio", "turf", "sports_centre", "club", "salon", "spa",
    "clinic", "dentist", "diagnostic_lab", "veterinary", "optician",
    "coworking", "education",
}

# ──────────────────────────────────────────────────────────────────────────
# Endpoints / infra
# ──────────────────────────────────────────────────────────────────────────
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_TIMEOUT = 180          # seconds, server-side query budget
HTTP_TIMEOUT = 12               # seconds, per outbound request (kept low for mass scraping)
USER_AGENT = "mello-lead-scraper/1.0 (+https://mello-omega.vercel.app)"

DB_PATH = os.path.join(os.path.dirname(__file__), "leads.db")
EXPORT_DIR = os.path.join(os.path.dirname(__file__), "exports")

# Optional Google Places enrichment. Set in the environment to enable:
#   PowerShell:  $env:GOOGLE_PLACES_API_KEY = "AIza..."
# Leave unset to run fully free on OpenStreetMap data only.
GOOGLE_PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "").strip()
