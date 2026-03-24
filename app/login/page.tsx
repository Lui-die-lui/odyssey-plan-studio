import { Suspense } from "react";

import { LoginScreen } from "@/features/auth/components/LoginScreen";

function LoginFallback() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
      <div
        aria-hidden
        className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-zinc-200/70 bg-white/55 px-5 py-9 shadow-sm dark:border-white/10 dark:bg-zinc-950/40 sm:px-8 sm:py-12"
      >
        <span className="h-6 w-40 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
        <span className="h-4 w-56 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
        <span className="mt-2 h-11 w-full animate-pulse rounded-full bg-zinc-200/80 dark:bg-zinc-700/60" />
        <span className="h-11 w-full animate-pulse rounded-full bg-zinc-200/80 dark:bg-zinc-700/60" />
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
