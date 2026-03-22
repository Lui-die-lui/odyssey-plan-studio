"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import { NewPlanReplaceGate } from "@/features/plan/components/NewPlanReplaceGate";
import { OdysseyInterviewChat } from "@/features/plan/components/odyssey-interview/OdysseyInterviewChat";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";
import { planCreateStepPath } from "@/features/plan/constants/plan-create-start";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";

const backLinkClass =
  "inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

const NewPlanAiPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { plan, loading: planLoading } = useMyPlan({ autoLoad: true });
  const manualHref = planCreateStepPath("manual", searchParams.toString());

  const confettiColorVariant =
    !planLoading && plan != null ? "colored" : "neutral";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas font-sans dark:bg-zinc-950">
      <LandingConfetti colorVariant={confettiColorVariant} />
      <SubpageGlassVeil />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PlanEditorLayout>
          <NewPlanReplaceGate>
            <div className="flex min-h-0 flex-1 flex-col gap-6">
              <PlanEditorPageHeader
                title="AI와 함께 방향 찾기"
                description="짧은 대화로 생각을 정리해요. 답은 나중에 플랜 초안으로 이어질 수 있어요."
                actions={
                  <button
                    type="button"
                    onClick={() => router.push("/plan/new")}
                    className={backLinkClass}
                  >
                    이전
                  </button>
                }
              />

              <div className="flex min-h-[min(520px,calc(100dvh-15rem))] flex-1 flex-col sm:min-h-[min(580px,calc(100dvh-13rem))]">
                <OdysseyInterviewChat manualHref={manualHref} />
              </div>
            </div>
          </NewPlanReplaceGate>
        </PlanEditorLayout>
      </div>
    </div>
  );
};

const NewPlanAiPageInner = () => (
  <Suspense
    fallback={
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-app-canvas px-4 py-16 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        <LandingConfetti />
        <SubpageGlassVeil />
        <span className="relative z-10">불러오는 중…</span>
      </div>
    }
  >
    <NewPlanAiPageContent />
  </Suspense>
);

const NewPlanAiPage = () => (
  <RequireAuthForPlan>
    <NewPlanAiPageInner />
  </RequireAuthForPlan>
);

export default NewPlanAiPage;
