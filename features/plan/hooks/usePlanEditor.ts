"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  PlanFormValues,
  YearlyPlanItemForm,
} from "../types/plan.types";
import { validatePlanForm } from "../lib/plan.validation";
import {
  PLAN_DEFAULTS,
  PLAN_YEAR_OPTIONS,
} from "../constants/plan.constants";

type UsePlanEditorOptions = {
  initialValues?: PlanFormValues;
  defaultYear?: number;
};

const createEmptyYearlyItem = (year: number): YearlyPlanItemForm => {
  return {
    year,
    goal: PLAN_DEFAULTS.emptyGoal,
    summary: PLAN_DEFAULTS.emptySummary,
    strengths: [...PLAN_DEFAULTS.emptyStrengths],
    weaknesses: [...PLAN_DEFAULTS.emptyWeaknesses],
  };
};

const createDefaultPlanForm = (opts?: {
  defaultYear?: number;
}): PlanFormValues => {
  const fallbackYear =
    typeof opts?.defaultYear === "number"
      ? opts.defaultYear
      : PLAN_YEAR_OPTIONS[0] ?? new Date().getFullYear();

  return {
    title: PLAN_DEFAULTS.emptyTitle,
    yearlyItems: [createEmptyYearlyItem(fallbackYear)],
  };
};

const clonePlanFormValues = (values: PlanFormValues): PlanFormValues => {
  return {
    title: values.title,
    yearlyItems: values.yearlyItems.map((item) => ({
      ...item,
      strengths: [...(item.strengths ?? [])],
      weaknesses: [...(item.weaknesses ?? [])],
    })),
  };
};

const normalizePlanFormValues = (opts?: {
  initialValues?: PlanFormValues;
  defaultYear?: number;
}): PlanFormValues => {
  const fallback = createDefaultPlanForm({ defaultYear: opts?.defaultYear });

  if (!opts?.initialValues) return fallback;

  const rawItems = Array.isArray(opts.initialValues.yearlyItems)
    ? opts.initialValues.yearlyItems
    : [];

  const yearlyItems =
    rawItems.length > 0 ? rawItems : fallback.yearlyItems;

  return {
    title: opts.initialValues.title,
    yearlyItems: yearlyItems.map((item, index) => {
      const fallbackYear =
        fallback.yearlyItems[index]?.year ?? fallback.yearlyItems[0]?.year;
      return {
        year: Number.isFinite(item.year) ? item.year : fallbackYear,
        goal: item.goal ?? PLAN_DEFAULTS.emptyGoal,
        summary: item.summary ?? PLAN_DEFAULTS.emptySummary,
        strengths: item.strengths ?? [...PLAN_DEFAULTS.emptyStrengths],
        weaknesses: item.weaknesses ?? [...PLAN_DEFAULTS.emptyWeaknesses],
      };
    }),
  };
};

export const usePlanEditor = (opts?: UsePlanEditorOptions) => {
  const resolvedInitialValues = useMemo(
    () => normalizePlanFormValues({ initialValues: opts?.initialValues, defaultYear: opts?.defaultYear }),
    [opts?.initialValues, opts?.defaultYear],
  );

  const [values, setValues] = useState<PlanFormValues>(resolvedInitialValues);

  const hydratedRef = useRef<boolean>(opts?.initialValues != null);

  useEffect(() => {
    if (opts?.initialValues == null) return;
    if (hydratedRef.current) return;

    setValues(clonePlanFormValues(resolvedInitialValues));
    hydratedRef.current = true;
  }, [opts?.initialValues, resolvedInitialValues]);

  const validation = useMemo(() => validatePlanForm(values), [values]);

  const resetForm = useCallback((nextValues?: PlanFormValues) => {
    setValues(
      nextValues ? clonePlanFormValues(nextValues) : clonePlanFormValues(resolvedInitialValues),
    );
  }, [resolvedInitialValues]);

  const setTitle = useCallback((title: string) => {
    setValues((prev) => ({ ...prev, title }));
  }, []);

  const setYearlyItems = useCallback((yearlyItems: YearlyPlanItemForm[]) => {
    setValues((prev) => ({ ...prev, yearlyItems }));
  }, []);

  const updateYearlyItem = useCallback(
    (index: number, patch: Partial<YearlyPlanItemForm>) => {
      setValues((prev) => {
        const nextItems = prev.yearlyItems.map((item, i) => {
          if (i !== index) return item;

          return {
            ...item,
            ...patch,
          };
        });

        return {
          ...prev,
          yearlyItems: nextItems,
        };
      });
    },
    [],
  );

  const addYearlyItem = useCallback((year?: number) => {
    setValues((prev) => {
      const nextYear =
        typeof year === "number"
          ? year
          : PLAN_YEAR_OPTIONS[0] ?? new Date().getFullYear();

      return {
        ...prev,
        yearlyItems: [...prev.yearlyItems, createEmptyYearlyItem(nextYear)],
      };
    });
  }, []);

  const removeYearlyItem = useCallback((index: number) => {
    setValues((prev) => ({
      ...prev,
      yearlyItems: prev.yearlyItems.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    values,
    validation,
    resetForm,
    setTitle,
    setYearlyItems,
    addYearlyItem,
    removeYearlyItem,
    updateYearlyItem,
  };
};

