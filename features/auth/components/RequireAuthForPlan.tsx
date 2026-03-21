"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import LoginRequiredModal from "@/features/auth/components/LoginRequiredModal";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";

type RequireAuthForPlanProps = {
  children: ReactNode;
};

/**
 * Blocks plan routes for guests and shows the shared login modal.
 */
const RequireAuthForPlan = ({ children }: RequireAuthForPlanProps) => {
  const { status } = useSession();
  const pathname = usePathname();
  const returnTo = pathname && pathname !== "/" ? pathname : "/my-plan";

  if (status === "loading") {
    return (
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-app-canvas px-4 py-16 text-sm text-zinc-600 dark:bg-black dark:text-zinc-400">
        <LandingConfetti />
        <span className="relative z-10">Checking your session…</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="relative flex min-h-[50vh] flex-1 flex-col overflow-hidden bg-app-canvas dark:bg-black">
        <LandingConfetti />
        <SubpageGlassVeil />
        <LoginRequiredModal open callbackUrl={returnTo} />
        <div className="relative z-10 mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <p>Sign in to use this page.</p>
          <Link
            href="/"
            className="font-medium text-black underline underline-offset-4 dark:text-zinc-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuthForPlan;
