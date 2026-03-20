"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import PlanForm from "@/features/plan/components/PlanForm";
import { usePlanEditor } from "@/features/plan/hooks/usePlanEditor";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";
import {
  mapPlanFormValuesToUpdatePayload,
  mapSavedPlanResponseToEditFormValues,
} from "@/features/plan/lib/plan.mapper";
import { updateMyPlan } from "@/features/plan/lib/plan.service";

const EditPlanPage = () => {
  const router = useRouter();
  const { plan, loading, error, refetch } = useMyPlan({ autoLoad: true });

  const initialFormValues = plan
    ? mapSavedPlanResponseToEditFormValues(plan)
    : undefined;

  const {
    values,
    validation,
    setTitle,
    updateYearlyItem,
    addYearlyItem,
    removeYearlyItem,
  } = usePlanEditor({
    initialValues: initialFormValues,
  });

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
        throw new Error("Missing planId. Please try again.");
      }

      const payload = mapPlanFormValuesToUpdatePayload(plan.planId, values);
      await updateMyPlan(payload);

      setStatus({
        type: "success",
        message: "Your plan was updated successfully.",
      });
      router.push("/my-plan");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update plan.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              Edit Plan
            </h1>

            <div className="flex gap-3">
              <Link
                href="/my-plan"
                className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-4 text-sm font-medium text-black transition-colors hover:bg-black/[.03] dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/[.05]"
              >
                Back
              </Link>
            </div>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Update your yearly goals and summaries.
          </p>
        </div>

        {loading ? (
          <div className="mt-6 rounded-md border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
            Loading your plan...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-6 rounded-md border border-red-400/30 bg-red-50 p-4 text-sm text-red-700 dark:bg-black/20 dark:text-red-300"
          >
            <p className="font-medium">Could not load your plan.</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-red-400/30 bg-white px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-400/20 dark:bg-black dark:text-red-200"
            >
              Retry
            </button>
          </div>
        ) : plan == null ? (
          <div className="mt-6 rounded-md border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-black dark:text-zinc-300">
            No saved plan yet.{" "}
            <Link
              href="/plan/new"
              className="font-medium text-black underline underline-offset-4 dark:text-zinc-50"
            >
              Create one now
            </Link>
            .
          </div>
        ) : (
          <div className="mt-6">
            {status ? (
              <div
                role={status.type === "error" ? "alert" : undefined}
                className={
                  status.type === "success"
                    ? "rounded-md border border-black/10 bg-white p-3 text-sm text-black dark:border-white/10 dark:bg-black dark:text-zinc-50"
                    : "rounded-md border border-red-400/30 bg-red-50 p-3 text-sm text-red-700 dark:bg-black/20 dark:text-red-300"
                }
              >
                {status.message}
              </div>
            ) : null}

            <PlanForm
              values={values}
              errors={validation.errors}
              isValid={validation.isValid}
              isSubmitting={isSubmitting}
              submitLabel="Update Plan"
              onTitleChange={setTitle}
              onYearlyItemChange={(index, patch) =>
                updateYearlyItem(index, patch)
              }
              onAddYearlyItem={(year) => addYearlyItem(year)}
              onRemoveYearlyItem={removeYearlyItem}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default EditPlanPage;

