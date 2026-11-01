"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { NewPlanReplaceGate } from "@/features/plan/components/NewPlanReplaceGate";
import { OdysseyInterviewChat } from "@/features/plan/components/odyssey-interview/OdysseyInterviewChat";
import { PlanContentSkeleton, PlanPageSkeleton } from "@/features/plan/components/PlanSkeletons";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";
import { planCreateStepPath } from "@/features/plan/constants/plan-create-start";

const NewPlanAiPageContent = () => {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const manualHref = planCreateStepPath("paths", query);
  const pathsHref = planCreateStepPath("paths", query);

  return (
    <PlanEditorLayout>
      <NewPlanReplaceGate fallback={<PlanContentSkeleton variant="interview" />}>
        <div className="flex min-h-0 flex-1 flex-col pb-12">
          <PlanEditorPageHeader
            title="AI와 함께 방향 찾기"
            description="공통 질문에 답하고, 세 가지 삶을 하나씩 떠올려 보세요. 서로 다른 5년 초안을 만들어 드려요."
          />
          <OdysseyInterviewChat manualHref={manualHref} pathsHref={pathsHref} />
        </div>
      </NewPlanReplaceGate>
    </PlanEditorLayout>
  );
};

const NewPlanAiPageInner = () => (
  <Suspense fallback={<PlanPageSkeleton variant="interview" />}>
    <NewPlanAiPageContent />
  </Suspense>
);

const NewPlanAiPage = () => (
  <RequireAuthForPlan fallback={<PlanPageSkeleton variant="interview" />}>
    <NewPlanAiPageInner />
  </RequireAuthForPlan>
);

export default NewPlanAiPage;
