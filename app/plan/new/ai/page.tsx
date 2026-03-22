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
  "inline-flex h-8 items-center justify-center rounded-full border border-transparent px-3 text-xs font-normal text-zinc-400 transition-colors hover:border-zinc-200/60 hover:bg-zinc-100/50 hover:text-zinc-600 dark:text-zinc-500 dark:hover:border-white/10 dark:hover:bg-white/[0.04] dark:hover:text-zinc-300";

const NewPlanAiPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { plan, loading: planLoading } = useMyPlan({ autoLoad: true });
  const manualHref = planCreateStepPath("manual", searchParams.toString());

  const confettiColorVariant =
    !planLoading && plan != null ? "colored" : "neutral";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas font-sans dark:bg-app-canvas-dark">
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
                // actions={
                //   <button
                //     type="button"
                //     onClick={() => router.push("/plan/new")}
                //     className={backLinkClass}
                //   >
                //     이전
                //   </button>
                // }
              />

              <div className="flex min-h-0 max-h-[min(620px,78dvh)] min-h-[min(380px,calc(100dvh-17rem))] flex-1 flex-col sm:max-h-[min(680px,72dvh)] sm:min-h-[min(420px,calc(100dvh-15rem))]">
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
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-app-canvas px-4 py-16 text-sm text-zinc-600 dark:bg-app-canvas-dark dark:text-zinc-400">
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
