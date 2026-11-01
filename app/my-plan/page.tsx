"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { ModalShell } from "@/components/common/ModalShell";
import { Notice } from "@/components/common/Notice";
import { buttonClass, eyebrowClass, helpTextClass, pageTitleClass } from "@/components/common/ui";
import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { bloomField } from "@/features/field/future-field-store";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";
import PlanSummary from "@/features/plan/components/PlanSummary";
import { LegacyPlanNotice, PlanPathsView } from "@/features/plan/components/PlanPathsView";
import {
  MyPlanActionsSkeleton,
  MyPlanPageSkeleton,
  PlanSummarySkeleton,
} from "@/features/plan/components/PlanSkeletons";

const formatSavedDate = (iso?: string) => {
  if (!iso) return null;
  const date = new Date(iso);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
};

const MyPlanPageInner = () => {
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  // Shown once after saving; the URL is cleaned so a refresh does not repeat it.
  const [justSaved, setJustSaved] = useState(searchParams.get("saved") === "1");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const { plan, loading, error, refetch } = useMyPlan({ autoLoad: true });

  useEffect(() => {
    if (justSaved) window.history.replaceState(null, "", "/my-plan");
  }, [justSaved]);

  const savedPlanLoaded = justSaved && plan != null;
  useEffect(() => {
    if (savedPlanLoaded) bloomField();
  }, [savedPlanLoaded]);

  const handleDownloadPdf = async () => {
    if (!plan) return;
    setPdfExporting(true);
    setPdfError(false);
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
      setPdfError(true);
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

  const savedDate = formatSavedDate(plan?.updatedAt);

  return (
    <main className="field-calm mx-auto w-full max-w-5xl flex-1 px-4 pt-8 sm:px-6 sm:pt-10">
      {justSaved ? (
        <Notice
          tone="success"
          className="mb-6"
          action={
            <button type="button" onClick={() => setJustSaved(false)} className={buttonClass("quiet")}>
              닫기
            </button>
          }
        >
          저장했어요. 이제 경로와 연차를 살펴보거나 PDF로 내보낼 수 있습니다.
        </Notice>
      ) : null}

      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className={eyebrowClass}>
            내 플랜{savedDate ? ` · ${savedDate} 저장` : ""}
          </p>
          <h1 className={`${pageTitleClass} mt-1.5`}>
            {loading ? "\u00a0" : plan ? (plan.title ?? "나의 5년 계획") : "내 플랜"}
          </h1>
        </div>

        {loading ? (
          <MyPlanActionsSkeleton />
        ) : plan ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfExporting}
              className={buttonClass("secondary", "flex-1 md:flex-none")}
            >
              {pdfExporting ? "PDF 만드는 중…" : "PDF 저장"}
            </button>
            <Link href="/plan/edit" className={buttonClass("primary", "flex-1 md:flex-none")}>
              수정하기
            </Link>
          </div>
        ) : null}
      </header>

      {pdfError ? (
        <Notice tone="error" className="mb-6">
          PDF를 만들지 못했어요. 잠시 후 다시 시도해 주세요.
        </Notice>
      ) : null}

      {loading ? (
        <PlanSummarySkeleton />
      ) : error ? (
        <Notice
          tone="error"
          action={
            <button type="button" onClick={refetch} className={buttonClass("secondary")}>
              다시 시도
            </button>
          }
        >
          {error}
        </Notice>
      ) : plan?.paths.length ? (
        <PlanPathsView plan={plan} />
      ) : plan ? (
        <div className="flex flex-col gap-6">
          <LegacyPlanNotice />
          <PlanSummary plan={plan} />
        </div>
      ) : (
        <section className="max-w-md">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            아직 저장된 플랜이 없어요
          </h2>
          <p className={`${helpTextClass} mt-1`}>
            질문에 답해 초안을 만들거나, 직접 작성해 시작할 수 있습니다.
          </p>
          <Link href="/plan/new" className={buttonClass("primary", "mt-4")}>
            플랜 시작하기
          </Link>
        </section>
      )}

      <footer className="mt-16 border-t border-line py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => {
            setWithdrawError(null);
            setWithdrawOpen(true);
          }}
          className="min-h-11 cursor-pointer rounded-lg text-sm text-ink-3 underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          회원 탈퇴
        </button>
      </footer>

      <ModalShell
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        titleId="withdraw-confirm-title"
        showCloseButton
      >
        <h2
          id="withdraw-confirm-title"
          className="pr-12 text-lg font-semibold tracking-tight text-ink"
        >
          정말 탈퇴하시겠습니까?
        </h2>
        <p className={`${helpTextClass} mt-2`}>
          7일 뒤 플랜을 포함한 모든 정보가 삭제되며 복구할 수 없습니다. 그동안 로그인과 서비스
          이용이 제한되고, 이후 재가입할 수 있습니다.
        </p>

        {withdrawError ? (
          <Notice tone="error" className="mt-4">
            {withdrawError}
          </Notice>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setWithdrawOpen(false)}
            disabled={withdrawBusy}
            className={buttonClass("secondary")}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmWithdraw()}
            disabled={withdrawBusy}
            className={buttonClass("danger")}
          >
            {withdrawBusy ? "처리 중…" : "탈퇴 요청"}
          </button>
        </div>
      </ModalShell>
    </main>
  );
};

const MyPlanPage = () => (
  <RequireAuthForPlan fallback={<MyPlanPageSkeleton />}>
    <Suspense fallback={<MyPlanPageSkeleton />}>
      <MyPlanPageInner />
    </Suspense>
  </RequireAuthForPlan>
);

export default MyPlanPage;
