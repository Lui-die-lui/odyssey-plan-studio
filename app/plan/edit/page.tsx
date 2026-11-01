"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type FormEvent } from "react";

import { Notice } from "@/components/common/Notice";
import { buttonClass } from "@/components/common/ui";
import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import PlanForm from "@/features/plan/components/PlanForm";
import { PlanPathsEditor } from "@/features/plan/components/PlanPathsEditor";
import { PlanPageSkeleton } from "@/features/plan/components/PlanSkeletons";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";
import { usePlanEditor } from "@/features/plan/hooks/usePlanEditor";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";
import {
  mapPlanFormValuesToSavePayload,
  mapSavedPlanResponseToEditFormValues,
} from "@/features/plan/lib/plan.mapper";
import { mapSavedPathsToForms } from "@/features/plan/lib/plan-path.mapper";
import { saveMyPlan } from "@/features/plan/lib/plan.service";
import type { SavedPlanResponse } from "@/features/plan/types/plan.types";

const PathsEditPage = ({ plan }: { plan: SavedPlanResponse }) => {
  const [forms] = useState(() => mapSavedPathsToForms(plan));
  return (
    <PlanEditorLayout>
      <PlanPathsEditor
        initialForms={forms}
        autosaveScope={`edit-paths:${plan.planId}`}
        planTitle={plan.title}
        isDraft={false}
        header={
          <PlanEditorPageHeader
            title="세 경로 수정"
            description="경로와 연차를 옮겨 가며 고치세요. 저장 전까지 내 플랜은 바뀌지 않습니다."
            actions={
              <Link href="/my-plan" className={buttonClass("quiet")}>
                나가기
              </Link>
            }
          />
        }
      />
    </PlanEditorLayout>
  );
};

const EditPlanRouter = () => {
  const { plan, loading, error, refetch } = useMyPlan({ autoLoad: true });
  const singleRequested = useSearchParams().get("target") === "single";

  if (!loading && plan?.paths.length && !singleRequested) return <PathsEditPage plan={plan} />;
  return <EditPlanPageInner plan={plan} loading={loading} error={error} refetch={refetch} />;
};

const EditPlanPageInner = ({
  plan,
  loading,
  error,
  refetch,
}: {
  plan: SavedPlanResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}) => {
  const router = useRouter();

  const initialFormValues = useMemo(
    () => (plan ? mapSavedPlanResponseToEditFormValues(plan) : undefined),
    [plan],
  );

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
    initialValues: initialFormValues,
    autosaveKey: plan ? `edit:${plan.planId}` : undefined,
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
      router.push("/my-plan?saved=1");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "저장하지 못했어요.");
      setIsSubmitting(false);
    }
  };

  if (loading) return <PlanPageSkeleton variant="edit" />;

  return (
    <PlanEditorLayout>
      {error ? (
        <Notice
          tone="error"
          action={
            <button type="button" onClick={refetch} className={buttonClass("secondary")}>
              다시 시도
            </button>
          }
        >
          {error}
        </Notice>
      ) : plan == null ? (
        <>
          <PlanEditorPageHeader
            title="수정할 플랜이 없어요"
            description="플랜을 먼저 만들면 여기에서 고칠 수 있습니다."
          />
          <div>
            <Link href="/plan/new" className={buttonClass("primary")}>
              플랜 시작하기
            </Link>
          </div>
        </>
      ) : (
        <>
          <PlanEditorPageHeader
            title="플랜 수정"
            description="연차를 옮겨 가며 고치세요. 저장 전까지 내 플랜은 바뀌지 않습니다."
            actions={
              <Link href="/my-plan" className={buttonClass("quiet")}>
                나가기
              </Link>
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
              저장하지 않았던 수정 내용을 복구했어요.
            </Notice>
          ) : null}

          <PlanForm
            values={values}
            errors={validation.errors}
            isValid={validation.isValid}
            isSubmitting={isSubmitting}
            submitLabel="저장하기"
            statusText={isDirty ? "저장하지 않은 변경이 있어요" : "변경 사항 없음"}
            hasChanges={isDirty}
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
      )}
    </PlanEditorLayout>
  );
};

const EditPlanPage = () => (
  <RequireAuthForPlan fallback={<PlanPageSkeleton variant="edit" />}>
    <Suspense fallback={<PlanPageSkeleton variant="edit" />}>
      <EditPlanRouter />
    </Suspense>
  </RequireAuthForPlan>
);

export default EditPlanPage;
