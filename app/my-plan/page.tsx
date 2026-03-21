"use client";

import Link from "next/link";
import { useState } from "react";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";
import PlanSummary from "@/features/plan/components/PlanSummary";

const MyPlanPageInner = () => {
  const [pdfExporting, setPdfExporting] = useState(false);
  const { plan, loading, error, refetch } = useMyPlan({ autoLoad: true });

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

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden bg-app-canvas font-sans dark:bg-black">
      <LandingConfetti />
      <SubpageGlassVeil />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10">
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
                  Create Plan
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
            <div className="rounded-md border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
              플랜을 불러오는 중...
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
