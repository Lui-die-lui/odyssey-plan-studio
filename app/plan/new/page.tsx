"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import { NewPlanReplaceGate } from "@/features/plan/components/NewPlanReplaceGate";
import { PlanCreateStartScreen } from "@/features/plan/components/PlanCreateStartScreen";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";

const NewPlanStartPageContent = () => {
  const searchParams = useSearchParams();
  const { plan, loading: planLoading } = useMyPlan({ autoLoad: true });

  const confettiColorVariant =
    !planLoading && plan != null ? "colored" : "neutral";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas font-sans dark:bg-app-canvas-dark">
      <LandingConfetti colorVariant={confettiColorVariant} />
      <SubpageGlassVeil />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PlanEditorLayout>
          <NewPlanReplaceGate>
            <>
              <PlanEditorPageHeader
                title="어떤 방식으로 시작할까요?"
                description="My Odyssey 여정을, 지금 편한 방식으로 열어 보세요."
              />
              <PlanCreateStartScreen
                searchQueryString={searchParams.toString()}
              />
            </>
          </NewPlanReplaceGate>
        </PlanEditorLayout>
      </div>
    </div>
  );
};

const NewPlanStartPageInner = () => (
  <Suspense
    fallback={
      <div className="relative flex flex-1 overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
        <LandingConfetti />
        <SubpageGlassVeil />
        <PlanEditorLayout>
          <div className="relative z-10 flex w-full flex-col gap-4 py-1">
            <div aria-hidden className="flex flex-col gap-3">
              <span className="h-8 w-64 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
              <span className="h-5 w-80 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
            </div>
            <div
              aria-hidden
              className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3">
                <span className="h-11 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-11 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
              </div>
            </div>
          </div>
        </PlanEditorLayout>
      </div>
    }
  >
    <NewPlanStartPageContent />
  </Suspense>
);

const NewPlanStartPage = () => (
  <RequireAuthForPlan>
    <NewPlanStartPageInner />
  </RequireAuthForPlan>
);

export default NewPlanStartPage;
