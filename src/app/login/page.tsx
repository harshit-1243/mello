import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in · mello",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  auth: "That sign-in link was invalid or has expired. Request a fresh one below.",
  "no-access": "You're signed in, but this email isn't linked to a facility yet.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const errorMessage = error ? ERRORS[error] : undefined;

  return (
    <main className="grid min-h-dvh place-items-center bg-stage px-6 text-on-stage">
      <div className="w-full max-w-[392px]">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[22px] font-semibold tracking-[-0.02em]">
          <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-gradient-to-br from-green to-green-press text-[15px] text-on-green">
            m
          </span>
          mello
        </Link>

        <h1 className="font-display text-[28px] font-semibold tracking-tightest">Facility sign-in</h1>
        <p className="mt-1.5 mb-6 text-[14.5px] text-on-stage/55">
          Access your dashboard — calls, bookings, and reports for your facility.
        </p>

        {errorMessage && (
          <p className="mb-4 rounded-[10px] border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-[13px] text-amber-300">
            {errorMessage}
          </p>
        )}

        <LoginForm />
      </div>
    </main>
  );
}
