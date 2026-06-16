"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {});

  if (state.sent) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-[14px] leading-relaxed text-on-stage/80">
        <p className="font-medium text-on-stage">Check your inbox.</p>
        <p className="mt-1.5">
          We sent a sign-in link to <span className="text-signal">{state.email}</span>. Open it on this device to
          continue. The link expires shortly.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-[13px] font-medium text-on-stage/70">
        Work email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={state.email}
        placeholder="you@facility.com"
        className="w-full rounded-[10px] border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-[15px] text-on-stage placeholder:text-on-stage/35 outline-none transition focus:border-signal/60 focus:bg-white/[0.06]"
      />

      {state.error && <p className="text-[13px] text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-[10px] bg-green px-4 py-2.5 text-[14.5px] font-semibold text-on-green transition hover:bg-green-press disabled:opacity-60"
      >
        {pending ? "Sending link…" : "Email me a sign-in link"}
      </button>

      <p className="mt-1 text-[12.5px] leading-relaxed text-on-stage/45">
        Passwordless. We&apos;ll email a one-time link — no password to remember.
      </p>
    </form>
  );
}
