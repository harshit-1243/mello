"""
SQLite storage for leads — zero-setup, single file (leads.db).

Design mirrors the banking data-layer's golden rule: upserts MERGE, never
blindly overwrite. A blank value never clobbers an existing real value, so
data quality only goes up as you re-run phases (seed -> enrich -> score).
"""

import sqlite3
from dataclasses import dataclass, fields, asdict
from datetime import datetime, timezone
from typing import Optional

from config import DB_PATH


@dataclass
class Lead:
    # identity
    id: str = ""                 # e.g. "osm:node/123" or "gplace:ChIJ..."
    source: str = ""             # osm | google
    name: str = ""
    category: str = ""           # mello vertical (gym, salon, clinic, ...)
    raw_type: str = ""           # original OSM tag, for debugging
    # contact
    phone: str = ""
    website: str = ""
    email: str = ""
    instagram: str = ""
    facebook: str = ""
    # location
    address: str = ""
    city: str = ""
    state: str = ""
    lat: Optional[float] = None
    lon: Optional[float] = None
    # signals (mostly from Google enrichment)
    rating: Optional[float] = None
    review_count: Optional[int] = None
    # output
    mello_fit_score: int = 0
    notes: str = ""
    # meta
    first_seen: str = ""
    last_updated: str = ""


_COLUMNS = [f.name for f in fields(Lead)]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    # wait (don't error) if another process/read holds the lock briefly
    conn.execute("PRAGMA busy_timeout=30000")
    return conn


def init_db() -> None:
    conn = connect()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS leads (
            id              TEXT PRIMARY KEY,
            source          TEXT,
            name            TEXT,
            category        TEXT,
            raw_type        TEXT,
            phone           TEXT,
            website         TEXT,
            email           TEXT,
            instagram       TEXT,
            facebook        TEXT,
            address         TEXT,
            city            TEXT,
            state           TEXT,
            lat             REAL,
            lon             REAL,
            rating          REAL,
            review_count    INTEGER,
            mello_fit_score INTEGER DEFAULT 0,
            notes           TEXT,
            first_seen      TEXT,
            last_updated    TEXT
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_category ON leads(category)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_score ON leads(mello_fit_score)")
    conn.commit()
    conn.close()


def _is_blank(v) -> bool:
    return v is None or (isinstance(v, str) and v.strip() == "")


def upsert(lead: Lead) -> str:
    """Insert or merge a lead. Returns 'insert' or 'merge'."""
    conn = connect()
    cur = conn.execute("SELECT * FROM leads WHERE id = ?", (lead.id,))
    existing = cur.fetchone()
    now = _now()

    if existing is None:
        lead.first_seen = now
        lead.last_updated = now
        cols = ", ".join(_COLUMNS)
        placeholders = ", ".join("?" for _ in _COLUMNS)
        conn.execute(
            f"INSERT INTO leads ({cols}) VALUES ({placeholders})",
            tuple(getattr(lead, c) for c in _COLUMNS),
        )
        conn.commit()
        conn.close()
        return "insert"

    # MERGE: new non-blank value wins; blank new value never clobbers existing.
    merged = dict(existing)
    incoming = asdict(lead)
    for col in _COLUMNS:
        if col in ("id", "first_seen"):
            continue
        new_val = incoming.get(col)
        if not _is_blank(new_val):
            merged[col] = new_val
    merged["last_updated"] = now

    set_clause = ", ".join(f"{c} = ?" for c in _COLUMNS if c != "id")
    conn.execute(
        f"UPDATE leads SET {set_clause} WHERE id = ?",
        tuple(merged[c] for c in _COLUMNS if c != "id") + (lead.id,),
    )
    conn.commit()
    conn.close()
    return "merge"


def all_leads(order_by_score: bool = True):
    conn = connect()
    q = "SELECT * FROM leads"
    if order_by_score:
        q += " ORDER BY mello_fit_score DESC, review_count DESC"
    rows = conn.execute(q).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def stats() -> dict:
    conn = connect()
    total = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
    with_phone = conn.execute(
        "SELECT COUNT(*) FROM leads WHERE phone != '' AND phone IS NOT NULL"
    ).fetchone()[0]
    with_web = conn.execute(
        "SELECT COUNT(*) FROM leads WHERE website != '' AND website IS NOT NULL"
    ).fetchone()[0]
    by_cat = conn.execute(
        "SELECT category, COUNT(*) c FROM leads GROUP BY category ORDER BY c DESC"
    ).fetchall()
    by_city = conn.execute(
        "SELECT city, COUNT(*) c FROM leads GROUP BY city ORDER BY c DESC"
    ).fetchall()
    conn.close()
    return {
        "total": total,
        "with_phone": with_phone,
        "with_website": with_web,
        "by_category": [(r["category"], r["c"]) for r in by_cat],
        "by_city": [(r["city"] or "?", r["c"]) for r in by_city],
    }
