import { Suspense } from "react";

import { LoginScreen } from "@/features/auth/components/LoginScreen";

function LoginFallback() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">불러오는 중…</p>
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
