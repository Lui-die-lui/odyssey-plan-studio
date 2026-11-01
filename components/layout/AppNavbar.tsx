"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { Skeleton } from "@/components/common/Skeleton";
import { clearPlanClientState } from "@/lib/plan-client-state";

const brandText =
  "text-sm font-normal tracking-tight text-ink font-landing-logo-serif-strong";

const navText =
  "inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2.5 text-sm text-ink-2 transition-colors duration-150 hover:text-ink";

/**
 * Top bar: site title (left) and auth actions (right).
 * Guest: login only. Signed in: my plan + logout, plus admin for admin users.
 */
export function AppNavbar() {
  const pathname = usePathname() ?? "";
  const { status, data: session } = useSession();

  const handleLogout = async () => {
    clearPlanClientState();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="relative z-20 shrink-0 border-b border-line/70 bg-canvas/80">
      <div
        className={
          "mx-auto flex h-14 max-w-6xl items-center justify-between " +
          "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] " +
          "sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]"
        }
      >
        <Link href="/" className={brandText}>
          MY ODYSSEY
        </Link>

        <nav
          className="flex items-center gap-1 sm:gap-2"
          aria-label="계정"
        >
          {status === "loading" ? (
            <div aria-hidden className="flex items-center gap-4 px-2.5 sm:gap-6">
              <Skeleton className="h-4 w-12 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
          ) : status === "unauthenticated" ? (
            <Link href="/login" className={navText}>
              로그인
            </Link>
          ) : (
            <>
              {session?.user?.role === "ADMIN" ? (
                <Link href="/admin/dashboard" className={navText}>
                  관리자
                </Link>
              ) : null}
              <Link
                href="/my-plan"
                aria-current={pathname === "/my-plan" ? "page" : undefined}
                className={navText}
              >
                내 플랜
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className={navText}
              >
                로그아웃
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
