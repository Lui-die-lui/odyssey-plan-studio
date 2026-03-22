"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import PlanForm from "@/features/plan/components/PlanForm";
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
import { saveMyPlan } from "@/features/plan/lib/plan.service";

const backLinkClass =
  "inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

const EditPlanPageInner = () => {
  const router = useRouter();
  const { plan, loading, error, refetch } = useMyPlan({ autoLoad: true });

  const initialFormValues = useMemo(
    () => (plan ? mapSavedPlanResponseToEditFormValues(plan) : undefined),
    [plan],
  );

  const {
    values,
    validation,
    resetForm,
    setTitle,
    setScore,
    setYearNote,
    setGoalLine,
    commitGoal,
    removeGoalLine,
    reorderGoals,
    commitKeyword,
    removeKeywordLine,
  } = usePlanEditor({
    initialValues: initialFormValues,
  });

  const confettiColorVariant =
    !loading && plan != null ? "colored" : "neutral";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (!plan?.planId) {
        throw new Error("저장된 플랜이 없습니다. 먼저 플랜을 만드세요.");
      }

      const payload = mapPlanFormValuesToSavePayload(values);
      await saveMyPlan(payload);

      setStatus({
        type: "success",
        message: "플랜이 업데이트되었습니다.",
      });
      router.push("/my-plan");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "플랜을 업데이트하지 못했습니다.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas font-sans dark:bg-app-canvas-dark">
      <LandingConfetti colorVariant={confettiColorVariant} />
      <SubpageGlassVeil />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PlanEditorLayout>
        {loading ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            플랜을 불러오는 중…
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50/90 p-5 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-300"
          >
            <p className="font-medium">플랜을 불러오지 못했습니다.</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-red-300/60 bg-white px-4 text-sm font-medium text-red-800 transition-colors hover:bg-red-50 dark:border-red-400/30 dark:bg-zinc-900 dark:text-red-200"
            >
              다시 시도
            </button>
          </div>
        ) : plan == null ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            저장된 플랜이 없습니다.{" "}
            <Link
              href="/plan/new"
              className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
            >
              새로 만들기
            </Link>
          </div>
        ) : (
          <>
            <PlanEditorPageHeader
              title="Edit Plan"
              description="연차별 목표와 거리 점수를 업데이트하세요."
              actions={
                <Link href="/my-plan" className={backLinkClass}>
                  나가기
                </Link>
              }
            />

            {status ? (
              <div
                role={status.type === "error" ? "alert" : undefined}
                className={
                  status.type === "success"
                    ? "mb-5 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-sm text-zinc-800 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-200"
                    : "mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-300"
                }
              >
                {status.message}
              </div>
            ) : null}

            <PlanForm
              mode="edit"
              values={values}
              errors={validation.errors}
              isValid={validation.isValid}
              isSubmitting={isSubmitting}
              submitLabel="수정 완료"
              submittingLabel="업데이트 중…"
              onReset={() => resetForm()}
              resetLabel="초기화"
              onTitleChange={setTitle}
              onScoreChange={setScore}
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
      </div>
    </div>
  );
};

const EditPlanPage = () => (
  <RequireAuthForPlan>
    <EditPlanPageInner />
  </RequireAuthForPlan>
);

export default EditPlanPage;
