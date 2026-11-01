"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { loginHref } from "@/features/auth/lib/login-href";

type RequireAuthForPlanProps = {
  children: ReactNode;
  /** Page-shaped skeleton shown until the session resolves or the redirect lands. */
  fallback: ReactNode;
};

/**
 * Blocks plan routes for guests and sends them to `/login` with a return URL.
 */
const RequireAuthForPlan = ({ children, fallback }: RequireAuthForPlanProps) => {
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

  if (status !== "authenticated") return <>{fallback}</>;

  return <>{children}</>;
};

export default RequireAuthForPlan;
