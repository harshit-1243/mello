"use client";

import { useEffect, useState } from "react";
import type { LiveCall } from "@/lib/dashboard/data";
import { clockFromSeconds, formatPhone } from "@/lib/dashboard/format";

/**
 * The dark "LIVE NOW" rail pinned at the top of the dashboard — the signature
 * element of the hybrid design. Shows the call in progress with a live timer
 * and a peek of the latest transcript line. Idle state when no call is active.
 */
export function LiveRail({ live }: { live: LiveCall | null }) {
  const [seconds, setSeconds] = useState(live?.elapsedSeconds ?? 0);

  useEffect(() => {
    if (!live) return;
    setSeconds(live.elapsedSeconds);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  return (
    <div className="is-stage relative overflow-hidden border-b border-[#262b22] bg-stage px-9 py-5 text-on-stage">
      {/* soft signal glow */}
      <div
        className="pointer-events-none absolute -left-[5%] -top-[60%] h-[320px] w-[55%]"
        style={{
          background:
            "radial-gradient(50% 50% at 25% 40%, color-mix(in srgb, var(--signal) 16%, transparent), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <div className="mb-3.5 flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#9aa093]">
          <SignalDot /> Live now
        </div>

        {live ? (
          <div className="flex items-center gap-[18px]">
            <span className="relative grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full border-2 border-signal text-signal">
              <span className="absolute inset-[-2px] animate-signal-pulse rounded-full border-2 border-signal" aria-hidden />
              ●
            </span>
            <div>
              <b className="text-[15px]">
                {formatPhone(live.phone)}
                {live.name ? ` · ${live.name}` : ""}
              </b>
              <div className="mt-0.5 text-[13px] text-[#9aa093]">{live.detail}</div>
            </div>
            <div className="ml-8 hidden max-w-[440px] truncate font-mono text-[13px] text-[#9aa093] lg:block">
              <span className="text-signal">mello:</span> {live.lastLine}
            </div>
            <div className="ml-auto text-right">
              <div className="tabular text-[22px] font-semibold text-signal">{clockFromSeconds(seconds)}</div>
              <div className="text-[11.5px] text-[#9aa093]">in progress</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1 text-[14px] text-[#9aa093]">
            <span className="h-[9px] w-[9px] rounded-full bg-[#3a4034]" />
            No calls in progress — Mello is standing by.
          </div>
        )}
      </div>
    </div>
  );
}

function SignalDot() {
  return (
    <span className="relative inline-block h-[9px] w-[9px] rounded-full bg-signal">
      <span className="absolute inset-0 animate-signal-pulse rounded-full bg-signal" aria-hidden />
    </span>
  );
}
