"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/dashboard/actions";

export function LogoutButton({ email }: { email: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        title={`Sign out ${email}`}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: "#8C86A8" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#F3F1FB")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#8C86A8")}
      >
        <LogOut size={15} />
      </button>
    </form>
  );
}
