"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import PlanForm from "@/features/plan/components/PlanForm";
import { usePlanEditor } from "@/features/plan/hooks/usePlanEditor";
import { saveMyPlan } from "@/features/plan/lib/plan.service";
import { mapPlanFormValuesToSavePayload } from "@/features/plan/lib/plan.mapper";

const NewPlanPage = () => {
  const router = useRouter();
  const { values, validation, setTitle, updateYearlyItem, addYearlyItem, removeYearlyItem } =
    usePlanEditor({
      defaultYear: new Date().getFullYear(),
    });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);

  const handleSubmit = async (_event: FormEvent<HTMLFormElement>) => {
    setStatus(null);
    setIsSubmitting(true);

    try {
      const payload = mapPlanFormValuesToSavePayload(values);
      await saveMyPlan(payload);

      setStatus({
        type: "success",
        message: "Your plan was saved successfully.",
      });

      router.push("/my-plan");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save plan.";
      setStatus({ type: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Create a new plan
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Add your yearly goals and summary. You can adjust them anytime later.
          </p>
        </div>

        {status ? (
          <div
            role="alert"
            className={
              status.type === "success"
                ? "mt-4 rounded-md border border-black/10 bg-white p-3 text-sm text-black dark:border-white/10 dark:bg-black dark:text-zinc-50"
                : "mt-4 rounded-md border border-red-400/30 bg-red-50 p-3 text-sm text-red-700 dark:bg-black/20 dark:text-red-300"
            }
          >
            {status.message}
          </div>
        ) : null}

        <div className="mt-6">
          <PlanForm
            values={values}
            errors={validation.errors}
            isValid={validation.isValid}
            isSubmitting={isSubmitting}
            submitLabel="Save Plan"
            onTitleChange={setTitle}
            onYearlyItemChange={(index, patch) => updateYearlyItem(index, patch)}
            onAddYearlyItem={(year) => addYearlyItem(year)}
            onRemoveYearlyItem={removeYearlyItem}
            onSubmit={handleSubmit}
          />
        </div>

      </main>
    </div>
  );
};

export default NewPlanPage;

