"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

function sanitizeReturnTo(raw: string | null): string {
  if (!raw) return "/";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return "/";
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return "/";
  if (decoded.length > 512) return "/";
  return decoded;
}

function AuthCompletePageContent() {
  const { status, data } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = useMemo(
    () => sanitizeReturnTo(searchParams.get("returnTo")),
    [searchParams],
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = data?.user?.role;
    if (role === "ADMIN") {
      router.replace("/admin/dashboard");
      return;
    }
    router.replace(returnTo);
  }, [status, data?.user?.role, returnTo, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-600 dark:text-zinc-400">
      로그인 정보를 확인하는 중…
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-zinc-600 dark:text-zinc-400">
          로그인 정보를 확인하는 중…
        </div>
      }
    >
      <AuthCompletePageContent />
    </Suspense>
  );
}
