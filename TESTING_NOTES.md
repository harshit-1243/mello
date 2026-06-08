# Testing notes — pick up here when credits reset

> Written at the end of the session that built Step 9 (WhatsApp + Razorpay) and
> Step 10 (dashboard, incl. live Supabase wiring + a "Test Mello" page).
> **Everything compiles with no errors** (`tsc --noEmit` clean for BOTH the web
> app and `agent/server`; all dashboard routes return 200). Nothing below is a
> blocker — these are the rough edges + the exact steps to test end-to-end.

---

## ✅ What's done & verified (no errors)

- **Step 9** — WhatsApp confirmation + Razorpay link (`agent/server/src/notify/`).
  Graceful: logs instead of sending when creds absent. `engine.createBooking`
  returns `amount`. Wired into `dispatchTool`. Smoke-tested.
- **Step 10 dashboard** — Hybrid design, lives at `/dashboard` in the Next app.
  Pages: Overview, Calls, Call detail (transcript + tool trace + booking),
  Bookings, Members, Settings, **Test Mello**. All render, all 200.
- **Live Supabase wiring (10.2, partial)** — `getCalls`, `getCall`, `getBookings`,
  `getMembers` read real Supabase rows when configured, else fall back to seed.
  (`src/lib/dashboard/live.ts` + `db.ts`.) `getOverview` + `getSettings` are
  still seed-only — finish later.
- **Test Mello page** (`/dashboard/test`) — chat **or** mic (browser speech-to-
  text), plays Mello's voice back. Proxies to the agent server's real
  `/test/start` + `/test/message` (the same `CallAgent` the phone uses), so each
  turn **persists to Supabase** and a confirmed booking **fires the WhatsApp
  confirmation**.

---

## 🧪 How to test the agent FULLY (chat/mic → DB → transcript → WhatsApp)

### 1. Env you need
**`agent/server/.env.local`:**
- `SARVAM_API_KEY` — already added (brain + voice).
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` — **required for persistence**. Without
  them the agent runs but saves nothing, so nothing shows in the dashboard.
- (optional) `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID` — Meta sandbox, to actually
  receive the WhatsApp message. Without them, the message is **logged** in the
  agent terminal instead (you'll still see exactly what would be sent).

**Web app `.env.local` (repo root):** create it with the **SAME** Supabase creds
so the dashboard reads what the agent writes:
```
SUPABASE_URL=...           # same project as the agent
SUPABASE_SERVICE_KEY=...   # same key
# AGENT_SERVER_URL=http://localhost:8080   # default, only set if different
```

### 2. Run both servers
```
# terminal 1
cd agent/server ; npm run dev          # → http://localhost:8080

# terminal 2  (repo root)
npm run dev                            # → http://localhost:3000
```

### 3. Drive a test
1. Open **http://localhost:3000/dashboard/test**.
2. "Calling as" → **Manan (member · Group 1)** → **Start call** (Mello greets +
   speaks).
3. Type or 🎙 say: **"kal 8 baje badminton book karna hai"**.
   - Expect: group-conflict handling → she offers an alternative TIME (same
     sport), no court numbers, code-switches to Hindi.
4. Accept an alternative ("5 baje kar do") → she confirms.
5. **Verify persistence:** open **/dashboard/calls** — the call should appear;
   click it to see the full transcript + the tool trace + the booking (with the
   court, which is staff-only).
6. **Verify WhatsApp:** if sandbox creds are set and your number is added as a
   recipient in Meta, the confirmation arrives on WhatsApp. Otherwise look for
   `📱 WhatsApp (not configured — message logged…)` in the agent terminal.

### Good test scenarios
- **Member, no price** — Harshit books tennis → no price quoted, ₹0.
- **Group conflict** — Manan or Bitu books badminton near a groupmate's slot.
- **Non-member payment** — "New caller" books badminton → ₹600 quoted → ask for
  the payment link → exercises `send_payment_link` (Razorpay placeholder link
  unless real keys set).
- **Amenity** — "do you have parking?" → graceful callback (`escalate_to_human`).

---

## 🐞 Mistakes / rough edges noticed (to fix later — none blocking)

1. **Test sessions never close.** `/test/message` never calls `endSession()`, so
   test calls' `call_logs` rows have no `ended_at`/`outcome`. In the dashboard
   Calls list they show **0:00 length** and status "handled" regardless of
   whether a booking happened. _Fix:_ add a `/test/end` endpoint, call it from
   the page's "End & reset", and set `outcome` from whether a booking was made.
2. **`intent` + `language` aren't stored.** The Calls list shows the call
   `outcome` as the intent and "—" for language on real/test data (the seed rows
   show the ideal). _Fix:_ either add `intent`/`language` columns to `call_logs`,
   or derive intent from the first caller transcript line.
3. **Overview + Settings still seed-only.** Stats, the live-call rail, and the
   Settings page don't read Supabase yet. _Fix:_ finish 10.2 for these (revenue
   needs a price calc since `bookings` has no amount column).
4. **No auth yet.** `/dashboard` is wide open — anyone who hits the URL sees
   everything. This is Step 10.3 (Supabase magic-link + per-facility RLS). Do
   NOT deploy the dashboard publicly until this is in.
5. **Booking↔call link is best-effort** (matched by phone + most-recent), because
   `bookings` has no `call_id`. Could mislink if a caller books twice. _Fix:_ add
   a `call_id` column to `bookings`.
6. **Audio autoplay** may be blocked on the very first reply until you've clicked
   in the page (browser policy). Subsequent replies play fine.
7. **Mic = browser speech-to-text** (Web Speech API, Chrome best). It is NOT the
   agent's Sarvam STT — it just turns your speech into text for the chat. Hinglish
   recognition is approximate; typing is most reliable for tricky phrases.
8. **WhatsApp 24h window (production).** Free-form messages only send within 24h
   of the customer messaging you. Proactive booking confirmations will need a
   Meta-approved **utility template** in production (sandbox + your own number is
   fine for the demo).

## ⚙️ Environment gotcha (not our bug)
- The dev terminal spits out lots of `Persisting failed / Compaction failed`
  lines. That's **Turbopack's disk cache failing against OneDrive** (`os error
  389` = OneDrive sync), not an app error — every route still compiles + returns
  200. If `.next` ever gets corrupted: `Remove-Item -Recurse -Force .next`. Real
  fix someday: move the repo off the OneDrive-synced folder.

---

## ▶️ Next steps (when you say go — per your order: pages → Supabase → auth)
- Finish **10.2**: wire Overview stats + live rail + Settings to Supabase.
- Then **10.3**: Supabase magic-link login + per-facility RLS (protect the
  dashboard before any deploy).
- Optional polish: close test sessions (#1), store intent/language (#2).
