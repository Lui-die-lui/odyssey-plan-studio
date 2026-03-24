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
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-app-canvas font-sans dark:bg-app-canvas-dark">
      <LandingConfetti />
      <SubpageGlassVeil />
      <main
        className={
          "relative z-10 mx-auto flex w-[min(100%,21.5rem)] max-w-md flex-col gap-6 rounded-2xl border border-zinc-200/75 " +
          "bg-white/45 px-5 py-9 text-zinc-900 shadow-sm backdrop-blur-xl backdrop-saturate-150 " +
          "dark:border-white/12 dark:bg-zinc-950/40 dark:text-zinc-50 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04)] " +
          "sm:w-full sm:px-8 sm:py-12"
        }
      >
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">LOGIN</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
          로그인 후 플랜을 생성하고 관리할 수 있습니다.
          </p>
        </header>

        <SocialLoginButtons callbackUrl={callbackUrl} />
      </main>
    </div>
  );
}
