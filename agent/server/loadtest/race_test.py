"""Double-booking race test for the INBOUND agent's persistence path (src/db/persistence.ts).

Replays `saveBooking` exactly — autocommit pre-check SELECT, then INSERT, 23505 → "conflict" —
from N threads released by one barrier, against a real Postgres loaded with db/schema.sql.
Never point this at production: it creates and drops its own facility rows.

    pip install "psycopg[binary]"
    PG_URL=postgresql://postgres:pg@127.0.0.1/mello_race python loadtest/race_test.py 100
"""
from __future__ import annotations

import os
import pathlib
import sys
import threading
import uuid

import psycopg

URL = os.environ["PG_URL"]
FAC = "race-test"
SCHEMA = pathlib.Path(__file__).resolve().parent.parent / "db" / "schema.sql"


def setup() -> None:
    with psycopg.connect(URL, autocommit=True) as c:
        c.execute(SCHEMA.read_text())
        c.execute("delete from bookings where facility_id=%s", (FAC,))
        c.execute("insert into facilities (id, name) values (%s, 'Race') on conflict do nothing", (FAC,))


def save_booking(court: str, date: str, start: str, end: str) -> str:
    """1:1 port of saveBooking(): pre-check, insert, map 23505 to conflict."""
    with psycopg.connect(URL, autocommit=True) as c:
        hit = c.execute(
            "select id from bookings where facility_id=%s and court_id=%s and booking_date=%s"
            " and start_time=%s limit 1", (FAC, court, date, start)).fetchone()
        if hit:
            return "conflict"
        try:
            c.execute(
                "insert into bookings (id, facility_id, sport, court_id, booking_date, start_time, end_time)"
                " values (%s,%s,'x',%s,%s,%s,%s)", (uuid.uuid4().hex, FAC, court, date, start, end))
            return "saved"
        except psycopg.errors.UniqueViolation:
            return "conflict"


def race(requests: list[tuple[str, str, str, str]]) -> list[str]:
    out: list[str] = [""] * len(requests)
    gate = threading.Barrier(len(requests))

    def run(i: int) -> None:
        gate.wait()
        try:
            out[i] = save_booking(*requests[i])
        except Exception as e:  # noqa: BLE001
            out[i] = f"error:{type(e).__name__}"

    ts = [threading.Thread(target=run, args=(i,)) for i in range(len(requests))]
    for t in ts:
        t.start()
    for t in ts:
        t.join()
    return out


def summary(res: list[str]) -> str:
    return ", ".join(f"{k}={res.count(k)}" for k in sorted(set(res)))


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    setup()

    print(f"[1] {n} callers, SAME court + date + start (tennis_1 2026-10-01 19:00-20:00)")
    for trial in range(1, 6):
        res = race([("tennis_1", f"2026-10-0{trial}", "19:00", "20:00")] * n)
        print(f"    trial {trial}: {summary(res)}  -> {'PASS' if res.count('saved') == 1 else 'FAIL'}")

    print("[2] 2 callers, SAME court, OVERLAPPING times (19:00-20:00 vs 19:30-20:30)")
    res = race([("tennis_1", "2026-10-10", "19:00", "20:00"), ("tennis_1", "2026-10-10", "19:30", "20:30")])
    print(f"    {summary(res)}  -> {'PASS' if res.count('saved') == 1 else 'FAIL (court double-booked)'}")

    print("[3] 2 callers, basketball FULL court vs HALF A, same time (share the same floor)")
    res = race([("basketball_full", "2026-10-11", "19:00", "20:00"),
                ("basketball_half_a", "2026-10-11", "19:00", "20:00")])
    print(f"    {summary(res)}  -> {'PASS' if res.count('saved') == 1 else 'FAIL (floor double-booked)'}")
