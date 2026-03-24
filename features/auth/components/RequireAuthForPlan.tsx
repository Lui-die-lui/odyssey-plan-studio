"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import { loginHref } from "@/features/auth/lib/login-href";

type RequireAuthForPlanProps = {
  children: ReactNode;
};

/**
 * Blocks plan routes for guests and sends them to `/login` with a return URL.
 */
const RequireAuthForPlan = ({ children }: RequireAuthForPlanProps) => {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const returnTo = useMemo(
    () => (pathname && pathname !== "/" ? pathname : "/my-plan"),
    [pathname],
  );

  useEffect(() => {
    if (status !== "unauthenticated") return;
    router.replace(loginHref(returnTo));
  }, [status, returnTo, router]);

  if (status === "loading") {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
        <LandingConfetti />
        <SubpageGlassVeil />
        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col py-8 sm:py-10">
          <div
            className={
              "flex w-full flex-col gap-4 " +
              "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] " +
              "sm:pl-[max(1.25rem,env(safe-area-inset-left))] sm:pr-[max(1.25rem,env(safe-area-inset-right))]"
            }
          >
            <div aria-hidden className="flex flex-col gap-3">
              <span className="h-8 w-64 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
              <span className="h-5 w-80 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
            </div>
            <div
              aria-hidden
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3">
                <span className="h-11 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-11 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="relative flex min-h-[50vh] flex-1 flex-col items-center justify-center overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
        <LandingConfetti />
        <SubpageGlassVeil />
        <div
          aria-hidden
          className="relative z-10 flex w-[min(100%,22rem)] flex-col gap-2 rounded-xl border border-zinc-200/70 bg-white/60 px-5 py-4 dark:border-white/10 dark:bg-zinc-950/45"
        >
          <span className="h-4 w-36 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
          <span className="h-4 w-56 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuthForPlan;
