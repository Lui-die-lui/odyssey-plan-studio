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
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-app-canvas px-4 py-16 text-sm text-zinc-600 dark:bg-black dark:text-zinc-400">
        <LandingConfetti />
        <span className="relative z-10">Checking your session…</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="relative flex min-h-[50vh] flex-1 flex-col items-center justify-center overflow-hidden bg-app-canvas dark:bg-black">
        <LandingConfetti />
        <SubpageGlassVeil />
        <p className="relative z-10 text-sm text-zinc-600 dark:text-zinc-400">
          로그인 화면으로 이동 중…
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuthForPlan;
