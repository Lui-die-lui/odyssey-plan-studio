"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { clearPlanClientState } from "@/lib/plan-client-state";
import { SUBPAGE_VEIL_SURFACE_CLASS } from "@/components/layout/subpage-veil-styles";

const brandText =
  "text-sm font-normal tracking-tight text-zinc-900 transition-colors hover:text-black dark:text-zinc-100 dark:hover:text-zinc-50 font-landing-logo-serif-strong";

const navText =
  "text-xs font-medium uppercase tracking-[0.2em] text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100";

/**
 * Top bar: site title (left) and auth actions (right).
 * Guest: LOGIN only. Signed in: MY PLAN + LOGOUT.
 */
export function AppNavbar() {
  const pathname = usePathname() ?? "";
  const { status } = useSession();
  /** Landing has no {@link SubpageGlassVeil}; match solid canvas so the bar is not tinted alone. */
  const isHome = pathname === "/" || pathname === "";

  const handleLogout = async () => {
    clearPlanClientState();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header
      className={
        isHome
          ? "shrink-0 bg-app-canvas dark:bg-app-canvas-dark"
          : `shrink-0 ${SUBPAGE_VEIL_SURFACE_CLASS}`
      }
    >
      <div
        className={
          "mx-auto flex h-12 max-w-5xl items-center justify-between " +
          "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] " +
          "sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]"
        }
      >
        <Link href="/" className={brandText}>
          MY ODYSSEY
        </Link>

        <nav
          className="flex items-center gap-6 sm:gap-8"
          aria-label="Account"
        >
          {status === "loading" ? (
            <div
              aria-hidden
              className="flex items-center gap-3 sm:gap-4"
            >
              <span className="h-5 w-10 animate-pulse rounded-full bg-zinc-200/80 dark:bg-zinc-700/60" />
              <span className="h-5 w-14 animate-pulse rounded-full bg-zinc-200/80 dark:bg-zinc-700/60" />
            </div>
          ) : status === "unauthenticated" ? (
            <Link href="/login" className={navText}>
              Login
            </Link>
          ) : (
            <>
              <Link href="/my-plan" className={navText}>
                My
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
