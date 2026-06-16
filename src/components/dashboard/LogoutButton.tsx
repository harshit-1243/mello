"use client";

import { logout } from "@/app/dashboard/actions";

/** Owner identity + sign-out, shown in the sidebar footer when auth is on. */
export function LogoutButton({ email }: { email: string }) {
  return (
    <form action={logout} className="mt-3 border-t border-line pt-3">
      <p className="truncate px-1 text-[12px] text-ink-muted" title={email}>
        {email}
      </p>
      <button
        type="submit"
        className="mt-1.5 w-full rounded-[9px] px-1 py-1.5 text-left text-[13px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        Sign out
      </button>
    </form>
  );
}
