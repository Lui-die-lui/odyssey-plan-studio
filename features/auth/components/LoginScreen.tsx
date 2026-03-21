"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import SocialLoginButtons from "@/features/auth/components/SocialLoginButtons";

function sanitizeCallbackUrl(raw: string | null): string {
  if (raw == null || raw === "") return "/";
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    return "/";
  }
  if (!s.startsWith("/") || s.startsWith("//")) return "/";
  if (s.length > 512) return "/";
  return s;
}

export function LoginScreen() {
  const searchParams = useSearchParams();
  const callbackUrl = useMemo(
    () => sanitizeCallbackUrl(searchParams.get("callbackUrl")),
    [searchParams],
  );

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-app-canvas font-sans dark:bg-black">
      <LandingConfetti />
      <SubpageGlassVeil />
      <main className="relative z-10 flex w-full max-w-md flex-col gap-6 bg-white px-6 py-12 text-black dark:bg-black dark:text-zinc-50">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">LOG IN</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
          로그인 후 플랜을 생성하고 관리할 수 있습니다.
          </p>
        </header>

        <SocialLoginButtons callbackUrl={callbackUrl} />
      </main>
    </div>
  );
}
