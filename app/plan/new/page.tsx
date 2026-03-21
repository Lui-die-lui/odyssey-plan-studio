"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import ExistingPlanConfirmModal from "@/features/plan/components/ExistingPlanConfirmModal";
import PlanForm from "@/features/plan/components/PlanForm";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";
import {
  NEW_PLAN_REPLACE_QUERY,
  NEW_PLAN_REPLACE_VALUE,
} from "@/features/plan/constants/plan.constants";
import { usePlanEditor } from "@/features/plan/hooks/usePlanEditor";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";
import { saveMyPlan } from "@/features/plan/lib/plan.service";
import { mapPlanFormValuesToSavePayload } from "@/features/plan/lib/plan.mapper";

const NewPlanPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replaceAcknowledged =
    searchParams.get(NEW_PLAN_REPLACE_QUERY) === NEW_PLAN_REPLACE_VALUE;

  const { plan, loading: planLoading } = useMyPlan({ autoLoad: true });

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
  } = usePlanEditor();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);

  const showReplaceGate = !planLoading && plan !== null && !replaceAcknowledged;

  const confettiColorVariant =
    !planLoading && plan != null ? "colored" : "neutral";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    void event;
    setStatus(null);
    setIsSubmitting(true);

    try {
      const payload = mapPlanFormValuesToSavePayload(values);
      await saveMyPlan(payload);

      setStatus({
        type: "success",
        message: "플랜이 저장되었습니다.",
      });

      router.push("/my-plan");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "플랜을 저장하지 못했습니다.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const acknowledgeReplace = () => {
    router.replace(
      `/plan/new?${NEW_PLAN_REPLACE_QUERY}=${NEW_PLAN_REPLACE_VALUE}`,
    );
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas font-sans dark:bg-zinc-950">
      <LandingConfetti colorVariant={confettiColorVariant} />
      <SubpageGlassVeil />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <ExistingPlanConfirmModal
          open={showReplaceGate}
          onCancel={() => router.push("/my-plan")}
          onConfirm={acknowledgeReplace}
        />

        <PlanEditorLayout>
        {planLoading ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300">
            불러오는 중…
          </div>
        ) : showReplaceGate ? null : (
          <>
            <PlanEditorPageHeader
              title="My Odyssey Plan"
              description="연차별 목표와 현재 상태를 정리해보세요."
            />

            {status ? (
              <div
                role="alert"
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
              mode="create"
              values={values}
              errors={validation.errors}
              isValid={validation.isValid}
              isSubmitting={isSubmitting}
              submitLabel="저장하기"
              submittingLabel="저장 중…"
              onReset={() => resetForm()}
              resetLabel="초기화"
              // actionFootnote="로그인한 상태에서 완성하기를 누르면 플랜이 저장됩니다."
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

const NewPlanPageInner = () => (
  <Suspense
    fallback={
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-app-canvas px-4 py-16 text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
        <LandingConfetti />
        <SubpageGlassVeil />
        <span className="relative z-10">불러오는 중…</span>
      </div>
    }
  >
    <NewPlanPageContent />
  </Suspense>
);

const NewPlanPage = () => (
  <RequireAuthForPlan>
    <NewPlanPageInner />
  </RequireAuthForPlan>
);

export default NewPlanPage;
