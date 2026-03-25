"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { ModalShell } from "@/components/common/ModalShell";
import { useRouter } from "next/navigation";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";
import PlanSummary from "@/features/plan/components/PlanSummary";

/** 본문 CTA와 구분되는 작은 텍스트 링크 (GitHub·이메일 등 확장용) */
const myPlanFooterLinkClass =
  "text-[11px] font-normal leading-normal text-zinc-500 decoration-zinc-400/0 underline-offset-2 transition-[color,text-decoration-color] duration-200 " +
  "hover:text-zinc-700 hover:decoration-zinc-500/50 hover:underline " +
  "focus-visible:rounded-sm focus-visible:text-zinc-700 focus-visible:underline focus-visible:decoration-zinc-500/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400/40 " +
  "dark:text-zinc-500 dark:hover:text-zinc-400 dark:hover:decoration-zinc-500/35 dark:focus-visible:text-zinc-300 dark:focus-visible:ring-zinc-500/35";

const MyPlanPageInner = () => {
  const [pdfExporting, setPdfExporting] = useState(false);
  const router = useRouter();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const { plan, loading, error, refetch } = useMyPlan({ autoLoad: true });

  const confettiColorVariant =
    !loading && plan != null ? "colored" : "neutral";

  const handleDownloadPdf = async () => {
    if (!plan) return;
    setPdfExporting(true);
    try {
      const res = await fetch(`/api/plans/${plan.planId}/summary-pdf`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "odyssey-plan-summary.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setPdfExporting(false);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (withdrawBusy) return;
    setWithdrawBusy(true);
    setWithdrawError(null);

    try {
      const res = await fetch("/api/account/withdraw", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data: unknown =
        await res
          .json()
          .catch(() => ({ message: "탈퇴 요청 중 오류가 발생했습니다." }));

      if (!res.ok) {
        const msg =
          typeof (data as { message?: unknown }).message === "string"
            ? ((data as { message: string }).message)
            : "탈퇴 요청에 실패했습니다.";
        setWithdrawError(msg);
        setWithdrawBusy(false);
        return;
      }

      setWithdrawOpen(false);
      await signOut({ callbackUrl: "/" });
      // signOut 이후 redirect 되지만, 혹시 모를 경우 대비.
      router.replace("/");
    } catch {
      setWithdrawError("네트워크 오류가 발생했습니다.");
      setWithdrawBusy(false);
    }
  };

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden bg-app-canvas font-sans dark:bg-app-canvas-dark">
      <LandingConfetti colorVariant={confettiColorVariant} />
      <SubpageGlassVeil />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-10 pb-0 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-semibold text-2xl font-normal tracking-tight text-black dark:text-zinc-50">
              My Plan
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {loading ? null : plan ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdf()}
                    disabled={pdfExporting}
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-zinc-300/90 bg-white/80 px-4 text-sm font-medium text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-100 dark:hover:bg-zinc-800/80"
                  >
                    {pdfExporting ? "PDF 생성 중…" : "PDF 저장"}
                  </button>
                  <Link
                    href="/plan/edit"
                    className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                  >
                    수정하기
                  </Link>
                </>
              ) : (
                <Link
                  href="/plan/new"
                  className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  플랜 생성
                </Link>
              )}
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            연차별 목표와 거리 점수 요약을 확인할 수 있습니다.
          </p>
        </div>

        <div className="mt-6">
          {loading ? (
            <div
              aria-hidden
              className="rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black"
            >
              <div className="flex flex-col gap-3">
                <span className="h-6 w-56 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-4 w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-4 w-11/12 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-4 w-10/12 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
              </div>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-md border border-red-400/30 bg-red-50 p-4 text-sm text-red-700 dark:bg-black/20 dark:text-red-300"
            >
              <p className="font-medium">플랜을 찾을 수 없습니다.</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={refetch}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-full border border-red-400/30 bg-white px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-400/20 dark:bg-black dark:text-red-200 dark:hover:bg-black"
              >
                Retry
              </button>
            </div>
          ) : (
            <PlanSummary
              plan={plan}
              emptyStateMessage="저장된 플랜이 없습니다. 새 플랜을 만들어 보세요."
            />
          )}
        </div>

        <nav
          aria-label="페이지 정보"
          className="mt-16 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 text-center sm:mt-20 sm:pb-[max(3rem,env(safe-area-inset-bottom))] sm:pt-12"
        >
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {/* 추후: GitHub, 이메일 등 동일 스타일 <li>로 나란히 추가 */}
            <li className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setWithdrawError(null);
                  setWithdrawOpen(true);
                }}
                className={myPlanFooterLinkClass}
                aria-describedby="my-plan-withdraw-hint"
              >
                회원 탈퇴
              </button>
              <span
                id="my-plan-withdraw-hint"
                className="text-[10px] font-normal leading-snug text-zinc-400 dark:text-zinc-500"
              >
                (삭제 후 복구 불가)
              </span>
            </li>
          </ul>
        </nav>

        <ModalShell
          open={withdrawOpen}
          onClose={() => setWithdrawOpen(false)}
          titleId="withdraw-confirm-title"
          showCloseButton
        >
          <h2
            id="withdraw-confirm-title"
            className="pr-8 text-xl font-semibold tracking-tight text-black dark:text-zinc-50"
          >
            정말 탈퇴 하시겠습니까?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            탈퇴 시 모든 정보가 사라지며 1주일 뒤 재가입 가능합니다.
          </p>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
            유예 기간 동안은 로그인/서비스 이용이 제한됩니다.
          </p>

          {withdrawError ? (
            <p className="mt-4 rounded-md border border-red-200/70 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-300">
              {withdrawError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setWithdrawOpen(false)}
              disabled={withdrawBusy}
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[.03] disabled:opacity-50 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/[.05]"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmWithdraw()}
              disabled={withdrawBusy}
              className="inline-flex h-11 items-center justify-center rounded-full bg-black px-4 text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:opacity-50 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
            >
              {withdrawBusy ? "처리 중…" : "탈퇴 요청"}
            </button>
          </div>
        </ModalShell>
      </main>
    </div>
  );
};

const MyPlanPage = () => (
  <RequireAuthForPlan>
    <MyPlanPageInner />
  </RequireAuthForPlan>
);

export default MyPlanPage;
