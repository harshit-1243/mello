# Mello Voice server

The voice agent backend. Long-running Node server that Twilio calls when the
phone rings. Deploys to **Railway** (not Vercel — Vercel is for the marketing
site; this needs a persistent process).

> Build sequence lives in the repo root `HANDOFF.md`. This is **Step 3**: prove
> the phone → server path with a TwiML hello, before wiring Sarvam STT/TTS
> (Steps 4–6) and the OpenAI brain (Step 5).

## Stack

- **Fastify** (TypeScript) — webhook server
- **twilio** SDK — TwiML generation + request-signature validation
- **tsx** for dev, **tsc** for the production build

## Run locally

```powershell
cd agent/server
npm install
Copy-Item .env.example .env.local   # then fill in once you have Twilio creds
npm run dev                          # http://localhost:8080
```

The server boots fine with **no Twilio credentials** — it just logs a warning.
You only need them to take real calls.

Quick checks:

```powershell
# health
curl http://localhost:8080/health

# simulate Twilio's incoming-call POST (returns TwiML XML)
curl -X POST http://localhost:8080/voice/incoming `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "From=%2B15551234567&To=%2B15557654321&CallSid=CAtest123"
```

## Wiring up Twilio (once KYC + auth clear)

1. Put `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` in `.env.local`.
2. Expose your local server to the internet (dev): `ngrok http 8080`.
3. In the Twilio console, set the number's **A call comes in** webhook to:
   `https://<your-public-url>/voice/incoming` (HTTP POST).
4. Call the number. You should hear *"Hello, can you hear me? This is Mello."*
5. Optional hardening: set `VALIDATE_TWILIO_SIGNATURE=true` and `PUBLIC_BASE_URL`
   to your public URL so forged requests get a 403.

## Deploy (Railway)

- New project → deploy from the GitHub repo, root directory `agent/server`.
- Build: `npm run build` · Start: `npm start` · Health check path: `/health`.
- Set the same env vars in Railway's dashboard (never commit them).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness probe (Railway). Reports `twilioConfigured` / `sarvamConfigured`. |
| GET | `/` | Friendly status JSON |
| POST | `/voice/incoming` | Twilio incoming-call webhook → greets, then `<Connect><Stream>` |
| WS | `/voice/stream` | Twilio Media Stream → Sarvam STT (transcripts logged) |

## Speech-to-text (Step 4)

On a call, Twilio streams the caller's μ-law 8 kHz audio to `/voice/stream`. We
convert it to PCM ([src/audio/mulaw.ts](src/audio/mulaw.ts)) and forward it to
**Sarvam streaming STT** ([src/voice/sttBridge.ts](src/voice/sttBridge.ts)),
auto-detecting language so Hindi↔English code-switching survives. Transcripts
are logged as `📝 Transcript: ...`.

Set `SARVAM_API_KEY` in `.env.local` to enable it. Without the key the call
still connects and audio frames are counted — you just won't get transcripts.
The agent doesn't speak back yet (that's Step 6).

## The brain (Step 5)

Each finalized transcript is fed to the **Sarvam chat LLM** (`sarvam-105b`) using
the facility's `system-prompt.md` as the system message. The model decides what
to say and which tools to call; we execute the tools and loop until it produces
a reply (logged as `🤖 Mello: ...`). Step 6 will speak that reply via TTS.

- **Brain loop:** [src/brain/agent.ts](src/brain/agent.ts) — Sarvam chat + tool-call cycle
- **Tools:** [src/brain/tools.ts](src/brain/tools.ts) — the 6 function schemas + dispatcher
- **Rules engine:** [src/booking/engine.ts](src/booking/engine.ts) — availability, member-only
  windows + T-30 release, group ±2h conflict, court assignment (seeded from `config.json`;
  swapped for Supabase in Step 7)
- **Facility data:** [src/facility/facility.ts](src/facility/facility.ts) — loads `config.json` +
  `system-prompt.md` from `agent/facilities/<id>/`

Same `SARVAM_API_KEY` powers STT **and** the brain. Caller identity (phone) is
passed from the call webhook into the media stream as a `<Parameter>`, so tools
like `verify_member` / `check_group` use the real caller — the model can't spoof it.
