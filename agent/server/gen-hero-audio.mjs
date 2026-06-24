/**
 * Generate the hero "live call" audio in Mello's real voice (Sarvam TTS) +
 * a captions JSON with per-line timings. Run from agent/server:
 *   node gen-hero-audio.mjs
 * Outputs: ../../public/audio/hero-call.wav  and  hero-call.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { SarvamAIClient } from "sarvamai";

// --- key from agent/server/.env.local ---
function envKey() {
  for (const f of [".env.local", ".env"]) {
    try {
      const m = readFileSync(new URL(f, import.meta.url), "utf8").match(/^\s*SARVAM_API_KEY\s*=\s*(.+)\s*$/m);
      if (m) return m[1].trim();
    } catch {}
  }
  return process.env.SARVAM_API_KEY;
}
const KEY = envKey();
if (!KEY) { console.error("No SARVAM_API_KEY"); process.exit(1); }
const client = new SarvamAIClient({ apiSubscriptionKey: KEY });

// (who, text, speaker) — Mello = ritu (F), Caller = a male voice
const LINES = [
  ["Mello", "Hi, thanks for calling Baseline Turf! How can I help?", "ritu"],
  ["Caller", "I'd like to book a five-a-side turf for tomorrow at seven PM.", "amit"],
  ["Mello", "Seven PM is taken, but eight PM is open. Does that work for you?", "ritu"],
  ["Caller", "Yeah, eight o'clock works perfectly.", "amit"],
  ["Mello", "Done! You're booked for eight PM. I've sent the confirmation on WhatsApp. Thank you!", "ritu"],
];

const GAP_MS = 450;

// --- minimal WAV helpers ---
function parseWav(buf) {
  // find "fmt " and "data" chunks
  let p = 12, fmt = null, data = null;
  while (p + 8 <= buf.length) {
    const id = buf.toString("ascii", p, p + 4);
    const size = buf.readUInt32LE(p + 4);
    if (id === "fmt ") {
      fmt = { channels: buf.readUInt16LE(p + 10), rate: buf.readUInt32LE(p + 12), bits: buf.readUInt16LE(p + 22) };
    } else if (id === "data") {
      data = buf.subarray(p + 8, p + 8 + size);
    }
    p += 8 + size + (size & 1);
  }
  return { fmt, data };
}
function buildWav(pcm, { channels, rate, bits }) {
  const byteRate = (rate * channels * bits) / 8;
  const blockAlign = (channels * bits) / 8;
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
  h.writeUInt16LE(channels, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(byteRate, 28);
  h.writeUInt16LE(blockAlign, 32); h.writeUInt16LE(bits, 34);
  h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const pcms = [];
const captions = [];
let fmt = null;
let tMs = 0;

for (const [who, text, speaker] of LINES) {
  process.stdout.write(`  TTS ${who} (${speaker})… `);
  const res = await client.textToSpeech.convert({ text, target_language_code: "en-IN", model: "bulbul:v3", speaker });
  const b64 = res.audios?.[0];
  if (!b64) { console.error("no audio"); process.exit(1); }
  const { fmt: f, data } = parseWav(Buffer.from(b64, "base64"));
  fmt ??= f;
  const durMs = Math.round((data.length / ((f.rate * f.channels * f.bits) / 8)) * 1000);
  captions.push({ who, text, start: +(tMs / 1000).toFixed(2), end: +((tMs + durMs) / 1000).toFixed(2) });
  pcms.push(data);
  tMs += durMs + GAP_MS;
  const gap = Buffer.alloc(Math.round((f.rate * f.channels * f.bits / 8) * (GAP_MS / 1000)));
  pcms.push(gap);
  console.log(`${durMs}ms`);
}

const wav = buildWav(Buffer.concat(pcms), fmt);
const outDir = new URL("../../public/audio/", import.meta.url);
mkdirSync(outDir, { recursive: true });
writeFileSync(new URL("hero-call.wav", outDir), wav);
writeFileSync(new URL("hero-call.json", outDir), JSON.stringify({ duration: +(tMs / 1000).toFixed(2), lines: captions }, null, 2));
console.log(`\nSAVED public/audio/hero-call.wav (${(wav.length / 1024).toFixed(0)} KB, ${(tMs / 1000).toFixed(1)}s) + hero-call.json`);
