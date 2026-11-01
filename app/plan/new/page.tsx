"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import { NewPlanReplaceGate } from "@/features/plan/components/NewPlanReplaceGate";
import { PlanCreateStartScreen } from "@/features/plan/components/PlanCreateStartScreen";
import { PlanContentSkeleton, PlanPageSkeleton } from "@/features/plan/components/PlanSkeletons";
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
          <NewPlanReplaceGate fallback={<PlanContentSkeleton variant="start" />}>
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
  <Suspense fallback={<PlanPageSkeleton variant="start" />}>
    <NewPlanStartPageContent />
  </Suspense>
);

const NewPlanStartPage = () => (
  <RequireAuthForPlan fallback={<PlanPageSkeleton variant="start" />}>
    <NewPlanStartPageInner />
  </RequireAuthForPlan>
);

export default NewPlanStartPage;
