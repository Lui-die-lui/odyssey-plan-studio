"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { NewPlanReplaceGate } from "@/features/plan/components/NewPlanReplaceGate";
import { PlanCreateStartScreen } from "@/features/plan/components/PlanCreateStartScreen";
import { PlanContentSkeleton, PlanPageSkeleton } from "@/features/plan/components/PlanSkeletons";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";

const NewPlanStartPageContent = () => {
  const searchParams = useSearchParams();

  return (
    <PlanEditorLayout>
      <NewPlanReplaceGate fallback={<PlanContentSkeleton variant="start" />}>
        <>
          <PlanEditorPageHeader
            title="어떻게 시작할까요?"
            description="어느 쪽을 골라도 저장하기 전에 직접 고칠 수 있어요."
          />
          <PlanCreateStartScreen searchQueryString={searchParams.toString()} />
        </>
      </NewPlanReplaceGate>
    </PlanEditorLayout>
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
