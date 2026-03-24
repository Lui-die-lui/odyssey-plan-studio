"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

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

const NewPlanAiPageContent = () => {
  const searchParams = useSearchParams();
  const { plan, loading: planLoading } = useMyPlan({ autoLoad: true });
  const manualHref = planCreateStepPath("manual", searchParams.toString());

  const confettiColorVariant =
    !planLoading && plan != null ? "colored" : "neutral";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-app-canvas font-sans dark:bg-app-canvas-dark">
      <LandingConfetti colorVariant={confettiColorVariant} />
      <SubpageGlassVeil />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PlanEditorLayout>
          <NewPlanReplaceGate>
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <PlanEditorPageHeader
                compactBelowDivider
                title="AI와 함께 방향 찾기"
                description="짧은 대화로 생각을 정리해요. 답변은 나중에 플랜 초안으로 이어질 수 있어요."
              />

              <div className="flex w-full flex-col">
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
      <div className="relative flex flex-1 overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
        <LandingConfetti />
        <SubpageGlassVeil />
        <PlanEditorLayout>
          <div className="relative z-10 flex w-full flex-col gap-3 py-1">
            <div aria-hidden className="flex flex-col gap-3">
              <span className="h-8 w-64 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
              <span className="h-5 w-[36rem] max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
            </div>
            <div
              aria-hidden
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3">
                <span className="h-10 w-3/4 animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-10 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-10 w-5/6 animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
              </div>
            </div>
          </div>
        </PlanEditorLayout>
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
