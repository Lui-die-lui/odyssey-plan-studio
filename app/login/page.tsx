import { Suspense } from "react";

import { Skeleton } from "@/components/common/Skeleton";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";

function LoginFallback() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
      <LandingConfetti />
      <SubpageGlassVeil />
      <div
        aria-hidden
        className="relative z-10 mx-auto flex w-[min(100%,21.5rem)] max-w-md flex-col gap-6 rounded-2xl border border-zinc-200/75 bg-white/45 px-5 py-9 shadow-sm backdrop-blur-xl dark:border-white/12 dark:bg-zinc-950/40 sm:w-full sm:px-8 sm:py-12"
      >
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-6 w-full max-w-72 rounded-md" />
        </div>
        <div className="flex items-center justify-center gap-5 sm:gap-6">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="size-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginScreen />
    </Suspense>
  );
}
