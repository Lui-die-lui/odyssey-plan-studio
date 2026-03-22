import Link from "next/link";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";

const textLinkClass =
  "text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-700 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400/50 dark:text-zinc-500 dark:hover:text-zinc-400 dark:focus-visible:ring-zinc-500/40";

export default function AccountWithdrawPage() {
  return (
    <RequireAuthForPlan>
      <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-app-canvas font-sans dark:bg-app-canvas-dark">
        <LandingConfetti colorVariant="neutral" />
        <SubpageGlassVeil />
        <main className="relative z-10 mx-auto flex w-full max-w-md flex-col px-4 py-16 text-center sm:px-6">
          <h1 className="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
            회원 탈퇴
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            탈퇴 절차는 준비 중입니다. 이후 이 페이지에서 안내·요청을 받을 수 있도록
            연결할 예정입니다.
          </p>
          <p className="mt-8">
            <Link href="/my-plan" className={textLinkClass}>
              My Plan으로 돌아가기
            </Link>
          </p>
        </main>
      </div>
    </RequireAuthForPlan>
  );
}
