import { Suspense } from "react";

import { Skeleton } from "@/components/common/Skeleton";
import { LoginScreen } from "@/features/auth/components/LoginScreen";

function LoginFallback() {
  return (
    <div aria-hidden className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-2 px-4 py-12">
      <Skeleton className="h-8 w-24 rounded-md" />
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="mt-4 h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
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
