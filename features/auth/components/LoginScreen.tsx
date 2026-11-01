"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { helpTextClass, pageTitleClass } from "@/components/common/ui";
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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className={pageTitleClass}>로그인</h1>
      <p className={`${helpTextClass} mt-2`}>
        플랜을 저장하고 이어서 작성하려면 로그인이 필요해요. 처음이라면 자동으로 가입됩니다.
      </p>
      <SocialLoginButtons className="mt-6" callbackUrl={callbackUrl} />
    </main>
  );
}
