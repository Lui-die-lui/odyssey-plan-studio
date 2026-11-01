"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Notice } from "@/components/common/Notice";
import { buttonClass } from "@/components/common/ui";
import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { NewPlanReplaceGate } from "@/features/plan/components/NewPlanReplaceGate";
import { PlanContentSkeleton, PlanPageSkeleton } from "@/features/plan/components/PlanSkeletons";
import PlanForm from "@/features/plan/components/PlanForm";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";
import { usePlanEditor } from "@/features/plan/hooks/usePlanEditor";
import {
  clearOdysseyAiPlanDraftFromSession,
  peekOdysseyAiPlanDraftFromSession,
} from "@/features/plan/lib/odyssey-ai-draft-session";
import { clearInterviewSession } from "@/features/plan/lib/odyssey-interview-session";
import { mapPlanFormValuesToSavePayload } from "@/features/plan/lib/plan.mapper";
import { saveMyPlan } from "@/features/plan/lib/plan.service";

const MANUAL_AUTOSAVE_KEY = "new";

const ManualPlanFormEditor = () => {
  const router = useRouter();

  // The page only mounts after the auth check, so storage is available here.
  // The draft stays stored until saved, so a refresh cannot lose what quota paid for.
  const [aiDraft] = useState(peekOdysseyAiPlanDraftFromSession);

  const {
    values,
    validation,
    isDirty,
    restored,
    clearAutosave,
    resetForm,
    setTitle,
    setScore,
    confirmUnverifiedScores,
    setYearNote,
    setGoalLine,
    commitGoal,
    removeGoalLine,
    reorderGoals,
    commitKeyword,
    removeKeywordLine,
  } = usePlanEditor({
    initialValues: aiDraft ?? undefined,
    autosaveKey: MANUAL_AUTOSAVE_KEY,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError(null);
    setIsSubmitting(true);

    try {
      await saveMyPlan(mapPlanFormValuesToSavePayload(values));
      clearAutosave();
      clearOdysseyAiPlanDraftFromSession();
      clearInterviewSession();
      router.push("/my-plan?saved=1");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장하지 못했어요.");
      setIsSubmitting(false);
    }
  };

  const statusText = aiDraft
    ? isDirty
      ? "수정한 초안이 아직 저장되지 않았어요"
      : "아직 저장되지 않은 AI 초안이에요"
    : isDirty
      ? "저장하지 않은 내용이 있어요"
      : "목표를 한 줄 이상 적으면 저장할 수 있어요";

  return (
    <PlanEditorLayout>
      <NewPlanReplaceGate fallback={<PlanContentSkeleton variant="form" />}>
        <>
          <PlanEditorPageHeader
            eyebrow={aiDraft ? "AI 초안" : undefined}
            title={aiDraft ? "초안을 내 계획으로 다듬기" : "새 플랜 작성"}
            description={
              aiDraft
                ? "문장을 고치고 점수를 직접 평가하세요. 저장하기 전까지 내 플랜에 반영되지 않습니다."
                : "연차를 옮겨 가며 적어 보세요. 한 해만 채워도 저장할 수 있습니다."
            }
          />

          {restored ? (
            <Notice
              className="mb-6"
              action={
                <button type="button" onClick={() => resetForm()} className={buttonClass("secondary")}>
                  복구 취소
                </button>
              }
            >
              저장하지 않았던 내용을 복구했어요.
            </Notice>
          ) : null}

          <PlanForm
            values={values}
            errors={validation.errors}
            isValid={validation.isValid}
            isSubmitting={isSubmitting}
            submitLabel="저장하기"
            statusText={statusText}
            hasChanges={isDirty || aiDraft != null}
            onReset={isDirty ? () => resetForm() : undefined}
            saveError={saveError ? <Notice tone="error">{saveError}</Notice> : undefined}
            onTitleChange={setTitle}
            onScoreChange={setScore}
            onConfirmUnverifiedScores={confirmUnverifiedScores}
            onYearNoteChange={setYearNote}
            onGoalChange={setGoalLine}
            onCommitGoal={commitGoal}
            onRemoveGoal={removeGoalLine}
            onReorderGoals={reorderGoals}
            onCommitKeyword={commitKeyword}
            onRemoveKeyword={removeKeywordLine}
            onSubmit={handleSubmit}
          />
        </>
      </NewPlanReplaceGate>
    </PlanEditorLayout>
  );
};

const NewPlanManualPageInner = () => (
  <Suspense fallback={<PlanPageSkeleton variant="form" />}>
    <ManualPlanFormEditor />
  </Suspense>
);

const NewPlanManualPage = () => (
  <RequireAuthForPlan fallback={<PlanPageSkeleton variant="form" />}>
    <NewPlanManualPageInner />
  </RequireAuthForPlan>
);

export default NewPlanManualPage;
