import Link from "next/link";

export default function AccountWithdrawPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-4 py-16 text-center sm:px-6">
      <h1 className="text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
        회원 탈퇴 안내
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        배포 안정화를 위해 이 페이지는 축소되었습니다. 탈퇴 요청은 `My Plan`
        화면에서 진행해주세요.
      </p>
      <p className="mt-8">
        <Link
          href="/my-plan"
          className="text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-700 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400/50 dark:text-zinc-500 dark:hover:text-zinc-400 dark:focus-visible:ring-zinc-500/40"
        >
          My Plan으로 이동
        </Link>
      </p>
    </main>
  );
}
