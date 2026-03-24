"use client";

import {
  Suspense,
  useLayoutEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import RequireAuthForPlan from "@/features/auth/components/RequireAuthForPlan";
import { SubpageGlassVeil } from "@/components/layout/SubpageGlassVeil";
import { LandingConfetti } from "@/features/landing/components/LandingConfetti";
import { NewPlanReplaceGate } from "@/features/plan/components/NewPlanReplaceGate";
import PlanForm from "@/features/plan/components/PlanForm";
import {
  PlanEditorLayout,
  PlanEditorPageHeader,
} from "@/features/plan/components/editor";
import { usePlanEditor } from "@/features/plan/hooks/usePlanEditor";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";
import { mapOdysseyAiPlanFormToPlanFormValues } from "@/features/plan/lib/odyssey-ai-plan-draft.mapper";
import {
  clearOdysseyAiPlanDraftFromSession,
  peekOdysseyAiPlanDraftFromSession,
} from "@/features/plan/lib/odyssey-ai-draft-session";
import { mapPlanFormValuesToSavePayload } from "@/features/plan/lib/plan.mapper";
import { saveMyPlan } from "@/features/plan/lib/plan.service";
import type { PlanFormValues } from "@/features/plan/types/plan.types";

type AiDraftBootstrap =
  | "pending"
  | { kind: "empty" }
  | { kind: "seeded"; values: PlanFormValues };

const ManualPlanFormEditor = ({
  initialValues,
}: {
  initialValues?: PlanFormValues;
}) => {
  const router = useRouter();

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
  } = usePlanEditor(
    initialValues != null ? { initialValues } : undefined,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);

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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas font-sans dark:bg-app-canvas-dark">
      <LandingConfetti colorVariant={confettiColorVariant} />
      <SubpageGlassVeil />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <PlanEditorLayout>
          <NewPlanReplaceGate>
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
          </NewPlanReplaceGate>
        </PlanEditorLayout>
      </div>
    </div>
  );
};

const NewPlanManualPageContent = () => {
  const [boot, setBoot] = useState<AiDraftBootstrap>("pending");

  useLayoutEffect(() => {
    const draft = peekOdysseyAiPlanDraftFromSession();
    if (draft) {
      setBoot({
        kind: "seeded",
        values: mapOdysseyAiPlanFormToPlanFormValues(draft),
      });
    } else {
      setBoot({ kind: "empty" });
    }
    const clearTimer = window.setTimeout(() => {
      clearOdysseyAiPlanDraftFromSession();
    }, 0);
    return () => window.clearTimeout(clearTimer);
  }, []);

  if (boot === "pending") {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
        <LandingConfetti />
        <SubpageGlassVeil />
        <PlanEditorLayout>
          <div className="relative z-10 flex w-full flex-col gap-4 py-1">
            <div aria-hidden className="flex flex-col gap-3">
              <span className="h-8 w-56 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
              <span className="h-5 w-72 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
            </div>
            <div
              aria-hidden
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3">
                <span className="h-10 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-10 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-10 w-11/12 animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-10 w-10/12 animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
              </div>
            </div>
          </div>
        </PlanEditorLayout>
      </div>
    );
  }

  const initialValues = boot.kind === "seeded" ? boot.values : undefined;

  return (
    <ManualPlanFormEditor
      key={boot.kind === "seeded" ? "ai-draft" : "manual-empty"}
      initialValues={initialValues}
    />
  );
};

const NewPlanManualPageInner = () => (
  <Suspense
    fallback={
      <div className="relative flex flex-1 overflow-hidden bg-app-canvas dark:bg-app-canvas-dark">
        <LandingConfetti />
        <SubpageGlassVeil />
        <PlanEditorLayout>
          <div className="relative z-10 flex w-full flex-col gap-4 py-1">
            <div aria-hidden className="flex flex-col gap-3">
              <span className="h-8 w-56 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
              <span className="h-5 w-72 max-w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
            </div>
            <div
              aria-hidden
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3">
                <span className="h-10 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-10 w-full animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
                <span className="h-10 w-11/12 animate-pulse rounded-xl bg-zinc-200/80 dark:bg-zinc-700/60" />
              </div>
            </div>
          </div>
        </PlanEditorLayout>
      </div>
    }
  >
    <NewPlanManualPageContent />
  </Suspense>
);

const NewPlanManualPage = () => (
  <RequireAuthForPlan>
    <NewPlanManualPageInner />
  </RequireAuthForPlan>
);

export default NewPlanManualPage;
