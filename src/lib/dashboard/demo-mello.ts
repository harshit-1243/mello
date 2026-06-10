/**
 * Self-contained scripted "Mello" for the public DEMO deploy.
 *
 * The real Test Mello page talks to the voice-agent server (brain + tools +
 * booking engine). That server can't run on a static Vercel share, so when the
 * dashboard is deployed in demo mode this lightweight state machine stands in:
 * it reproduces the headline booking flows (non-member pay-flow, member group
 * conflict, straight member booking, amenity callback) convincingly enough to
 * click through — without any network call.
 *
 * Honest by design: the page shows a "Demo" badge whenever this is in use.
 */

export interface DemoPersona {
  name: string;
  isMember: boolean;
  group?: string; // e.g. "Group 1" — drives the conflict line
}

export interface DemoState {
  persona: DemoPersona;
  step: "greeted" | "awaiting_time" | "awaiting_payment" | "done";
  sport?: string;
}

const SPORTS = ["badminton", "tennis", "pickleball", "basketball"];
const AMENITIES = ["parking", "locker", "food", "cafe", "coach", "coaching", "shower", "washroom"];

export function demoGreeting(p: DemoPersona): string {
  return p.isMember
    ? `Hi ${p.name}! Welcome to Raheja Ileseum — how can I help?`
    : `Hi! Welcome to Raheja Ileseum — how can I help?`;
}

function has(text: string, words: string[]): string | null {
  const t = text.toLowerCase();
  for (const w of words) if (t.includes(w)) return w;
  return null;
}

/** Returns Mello's next line given the running state (mutated in place). */
export function demoReply(state: DemoState, userText: string): string {
  const t = userText.toLowerCase();
  const { persona } = state;

  // Amenity questions → graceful human callback, any time.
  if (has(t, AMENITIES)) {
    return `Good question — let me have someone from the team call you back with those details shortly. Is this number okay?`;
  }

  // Step: caller is choosing an offered alternative time.
  if (state.step === "awaiting_time") {
    const picked = t.match(/\b(5|6|9|10|11)\b/) || has(t, ["haan", "ok", "okay", "sure", "theek", "chalega", "yes", "kar do", "kar de"]);
    if (picked) {
      const time = (t.match(/\b(5|6|9|10|11)\b/)?.[1]) ?? "9";
      const sport = state.sport ?? "badminton";
      if (persona.isMember) {
        state.step = "done";
        return `Done ${persona.name}! ${cap(sport)}, ${time} se ${Number(time) + 1} PM. Confirmation WhatsApp pe aa raha hai. See you! ✅`;
      }
      state.step = "awaiting_payment";
      const price = sport === "tennis" ? "₹1,200" : sport === "basketball" ? "₹1,600" : "₹600";
      return `Great — 1 hour ke liye ${price} hoga. Aap WhatsApp pe payment link se pay kar sakte hain, ya venue pe. Kya theek rahega?`;
    }
    return `No problem — 5 PM ya 6 PM mein se koi chalega?`;
  }

  // Step: non-member choosing how to pay.
  if (state.step === "awaiting_payment") {
    state.step = "done";
    if (has(t, ["venue", "cash", "wahan", "vahan", "pe kar"])) {
      return `Done! Booking confirmed — payment at the venue. Confirmation WhatsApp pe aa raha hai. See you! ✅`;
    }
    return `Perfect — payment link WhatsApp pe bhej diya hai. Booking confirmed once it's paid. See you! ✅`;
  }

  if (state.step === "done") {
    return `All set! Anything else I can help with?`;
  }

  // Fresh booking intent.
  const sport = has(t, SPORTS);
  if (sport) {
    state.sport = sport;

    // Member in a group asking for badminton ~8 PM → group-conflict catch.
    if (persona.isMember && persona.group && sport === "badminton" && /\b8\b/.test(t)) {
      state.step = "awaiting_time";
      return `Ek sec… 8 PM ${sport} uplabdh nahi hai. 5 PM ya 6 PM chalega?`;
    }

    // Non-member badminton 8 PM → "booked", offer a later time.
    if (!persona.isMember && sport === "badminton" && /\b8\b/.test(t)) {
      state.step = "awaiting_time";
      return `Let me check… 8 PM ke courts booked hain, but 9 PM available hai. Chalega?`;
    }

    // Otherwise: available → confirm straight away.
    const timeMatch = t.match(/\b(\d{1,2})\b/);
    const time = timeMatch ? timeMatch[1] : null;
    if (persona.isMember) {
      state.step = "done";
      const when = time ? `${time} se ${Number(time) + 1} PM` : "aapke time pe";
      return `Done ${persona.name}! ${cap(sport)}, ${when}. Confirmation WhatsApp pe aa raha hai. ✅`;
    }
    state.step = "awaiting_payment";
    const price = sport === "tennis" ? "₹1,200" : sport === "basketball" ? "₹1,600" : "₹600";
    return `Got it — ${sport} available hai. 1 hour ke liye ${price}. WhatsApp link se pay karein ya venue pe?`;
  }

  // Greeting niceties / fallback.
  if (has(t, ["hi", "hello", "namaste", "hey"])) {
    return persona.isMember ? `Hi ${persona.name}! What would you like to book?` : `Hi! What would you like to book today?`;
  }
  return `I can help you book a court — try something like "kal 8 baje badminton book karna hai". Which sport and time?`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
