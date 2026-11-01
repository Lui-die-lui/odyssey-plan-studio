import Link from "next/link";

import { buttonClass, helpTextClass, pageTitleClass } from "@/components/common/ui";

export default function AccountWithdrawPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className={pageTitleClass}>회원 탈퇴 안내</h1>
      <p className={`${helpTextClass} mt-2`}>
        탈퇴 요청은 내 플랜 화면 맨 아래에서 할 수 있어요.
      </p>
      <p className="mt-6">
        <Link href="/my-plan" className={buttonClass("secondary")}>
          내 플랜으로 이동
        </Link>
      </p>
    </main>
  );
}
