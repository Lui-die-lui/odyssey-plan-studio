"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

import { clearPlanClientState } from "@/lib/plan-client-state";

const brandText =
  "text-sm font-semibold tracking-tight text-zinc-900 transition-colors hover:text-black dark:text-zinc-100 dark:hover:text-zinc-50";

const navText =
  "text-xs font-medium uppercase tracking-[0.2em] text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100";

/**
 * Top bar: site title (left) and auth actions (right).
 * Guest: LOGIN only. Signed in: MY PLAN + LOGOUT.
 */
export function AppNavbar() {
  const { status } = useSession();

  const handleLogout = async () => {
    clearPlanClientState();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="shrink-0 bg-app-canvas/90 backdrop-blur-sm dark:bg-app-canvas-dark dark:backdrop-blur-none">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className={brandText}>
          Odyssey Plan
        </Link>

        <nav
          className="flex items-center gap-6 sm:gap-8"
          aria-label="Account"
        >
          {status === "loading" ? (
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              …
            </span>
          ) : status === "unauthenticated" ? (
            <Link href="/login" className={navText}>
              Login
            </Link>
          ) : (
            <>
              <Link href="/my-plan" className={navText}>
                My Plan
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={navText}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
