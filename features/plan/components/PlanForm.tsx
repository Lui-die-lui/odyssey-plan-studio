"use client";

import React from "react";
import type {
  PlanFormValues,
  YearlyPlanItemForm,
} from "../types/plan.types";
import type { PlanFormValidationErrors } from "../lib/plan.validation";
import { PLAN_YEAR_OPTIONS } from "../constants/plan.constants";

export type PlanFormProps = {
  values: PlanFormValues;
  errors: PlanFormValidationErrors;
  isValid: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;

  onTitleChange: (title: string) => void;
  onYearlyItemChange: (
    index: number,
    patch: Partial<YearlyPlanItemForm>,
  ) => void;
  onAddYearlyItem: (year?: number) => void;
  onRemoveYearlyItem: (index: number) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

const joinBullets = (bullets?: string[]) => {
  if (!bullets?.length) return "";
  return bullets.join("\n");
};

const parseBullets = (raw: string) => {
  return raw
    .split(/[\n,]/g)
    .map((v) => v.trim())
    .filter(Boolean);
};

const PlanForm = ({
  values,
  errors,
  isValid,
  isSubmitting,
  submitLabel,
  onTitleChange,
  onYearlyItemChange,
  onAddYearlyItem,
  onRemoveYearlyItem,
  onSubmit,
}: PlanFormProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-6 rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black"
    >
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-black dark:text-zinc-50"
          htmlFor="plan-title"
        >
          Plan title (optional)
        </label>
        <input
          id="plan-title"
          type="text"
          value={values.title ?? ""}
          onChange={(e) => onTitleChange(e.target.value)}
          className="h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm text-black outline-none transition-colors focus:border-black/20 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:focus:border-white/20"
          placeholder="e.g., My 2026 Life Plan"
          autoComplete="off"
        />
        {errors.title ? (
          <p className="text-sm text-red-600">{errors.title}</p>
        ) : null}
      </div>

      {errors.form ? (
        <div role="alert" className="text-sm text-red-600">
          {errors.form}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {values.yearlyItems.map((item, index) => {
          const yearErrors = errors.yearlyItems?.[index];
          const strengthsErrors = yearErrors?.strengths;
          const weaknessesErrors = yearErrors?.weaknesses;

          return (
            <fieldset
              key={`${item.year}-${index}`}
              className="flex flex-col gap-4 rounded-md border border-black/10 p-4 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex w-full flex-col gap-2">
                  <label className="text-sm font-medium text-black dark:text-zinc-50">
                    Year
                  </label>
                  <select
                    value={item.year}
                    onChange={(e) => {
                      const nextYear = Number(e.target.value);
                      onYearlyItemChange(index, {
                        year: nextYear,
                      });
                    }}
                    className="h-11 w-full rounded-md border border-black/10 bg-white px-3 text-sm text-black outline-none transition-colors focus:border-black/20 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:focus:border-white/20"
                  >
                    {PLAN_YEAR_OPTIONS.map((year) => (
                      <option value={year} key={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {yearErrors?.year ? (
                    <p className="text-sm text-red-600">
                      {yearErrors.year}
                    </p>
                  ) : null}
                </div>

                {values.yearlyItems.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemoveYearlyItem(index)}
                    className="mt-6 h-9 shrink-0 rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-black transition-colors hover:bg-black/[.03] dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/[.05]"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black dark:text-zinc-50">
                  Yearly goal
                </label>
                <textarea
                  value={item.goal}
                  onChange={(e) =>
                    onYearlyItemChange(index, { goal: e.target.value })
                  }
                  rows={2}
                  className="min-h-14 w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/20 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:focus:border-white/20"
                  placeholder="What do you want to achieve this year?"
                />
                {yearErrors?.goal ? (
                  <p className="text-sm text-red-600">{yearErrors.goal}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black dark:text-zinc-50">
                  Yearly summary
                </label>
                <textarea
                  value={item.summary}
                  onChange={(e) =>
                    onYearlyItemChange(index, { summary: e.target.value })
                  }
                  rows={3}
                  className="min-h-24 w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/20 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:focus:border-white/20"
                  placeholder="A short summary for this year."
                />
                {yearErrors?.summary ? (
                  <p className="text-sm text-red-600">{yearErrors.summary}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black dark:text-zinc-50">
                  Strengths (one per line)
                </label>
                <textarea
                  value={joinBullets(item.strengths)}
                  onChange={(e) => {
                    onYearlyItemChange(index, {
                      strengths: parseBullets(e.target.value),
                    });
                  }}
                  rows={3}
                  className="min-h-20 w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/20 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:focus:border-white/20"
                  placeholder={"e.g.\nConsistency\nCuriosity"}
                />
                {strengthsErrors?.length ? (
                  <div className="flex flex-col gap-1">
                    {strengthsErrors.map((err) => (
                      <p className="text-sm text-red-600" key={err.index}>
                        Strength #{err.index + 1}: {err.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-black dark:text-zinc-50">
                  Weaknesses (one per line)
                </label>
                <textarea
                  value={joinBullets(item.weaknesses)}
                  onChange={(e) => {
                    onYearlyItemChange(index, {
                      weaknesses: parseBullets(e.target.value),
                    });
                  }}
                  rows={3}
                  className="min-h-20 w-full resize-y rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/20 dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:focus:border-white/20"
                  placeholder={"e.g.\nProcrastination\nLow energy"}
                />
                {weaknessesErrors?.length ? (
                  <div className="flex flex-col gap-1">
                    {weaknessesErrors.map((err) => (
                      <p className="text-sm text-red-600" key={err.index}>
                        Weakness #{err.index + 1}: {err.message}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => onAddYearlyItem()}
          className="h-11 rounded-md border border-black/10 bg-white px-5 text-sm font-medium text-black transition-colors hover:bg-black/[.03] dark:border-white/10 dark:bg-black dark:text-zinc-50 dark:hover:bg-white/[.05]"
        >
          Add Year
        </button>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="h-11 rounded-md bg-black px-5 text-sm font-medium text-white transition-colors hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Saving..." : submitLabel ?? "Save Plan"}
        </button>
      </div>
    </form>
  );
};

export default PlanForm;

