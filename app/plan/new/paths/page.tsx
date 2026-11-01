"use client";

import { Suspense, useState } from "react";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { NewPlanReplaceGate } from "@/features/plan/components/NewPlanReplaceGate";
import { PlanPathsEditor } from "@/features/plan/components/PlanPathsEditor";
import { PlanContentSkeleton, PlanPageSkeleton } from "@/features/plan/components/PlanSkeletons";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";
import { peekOdysseyAiPathsDraftFromSession } from "@/features/plan/lib/odyssey-ai-draft-session";
import {
  createEmptyPathForms,
  mapAiDraftToPathForms,
} from "@/features/plan/lib/plan-path.mapper";

const NewPlanPathsContent = () => {
  // Mounted only after the auth check, so storage is available here.
  const [draft] = useState(peekOdysseyAiPathsDraftFromSession);
  const [forms] = useState(() => (draft ? mapAiDraftToPathForms(draft) : createEmptyPathForms()));

  return (
    <PlanEditorLayout>
      <NewPlanReplaceGate fallback={<PlanContentSkeleton variant="form" />}>
        <PlanPathsEditor
          initialForms={forms}
          autosaveScope="new-paths"
          planTitle={draft?.title}
          sharedPreparations={draft?.sharedPreparations}
          isDraft={draft != null}
          header={
            <PlanEditorPageHeader
              eyebrow={draft ? "AI 초안" : undefined}
              title={draft ? "세 경로를 내 계획으로 다듬기" : "세 경로 직접 작성"}
              description={
                draft
                  ? "문장을 고치고 경로 전체를 직접 평가하세요. 저장하기 전까지 내 플랜에 반영되지 않습니다."
                  : "경로를 옮겨 가며 떠오르는 만큼 적어 보세요. 한 경로만 채워도 저장할 수 있습니다."
              }
            />
          }
        />
      </NewPlanReplaceGate>
    </PlanEditorLayout>
  );
};

const NewPlanPathsPageInner = () => (
  <Suspense fallback={<PlanPageSkeleton variant="form" />}>
    <NewPlanPathsContent />
  </Suspense>
);

const NewPlanPathsPage = () => (
  <RequireAuthForPlan fallback={<PlanPageSkeleton variant="form" />}>
    <NewPlanPathsPageInner />
  </RequireAuthForPlan>
);

export default NewPlanPathsPage;
