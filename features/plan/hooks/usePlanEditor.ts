"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type {
  PlanFormValues,
  PlanGoalLineForm,
  PlanYearForm,
  PlanYearScores,
} from "../types/plan.types";
import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
import { validatePlanForm } from "../lib/plan.validation";
import { normalizePlanFormValues } from "../lib/plan.mapper";
import { newPlanGoalId } from "../lib/plan-goal-id";
import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
} from "../constants/plan.constants";

type UsePlanEditorOptions = {
  initialValues?: PlanFormValues;
};

const cloneValues = (v: PlanFormValues): PlanFormValues => ({
  title: v.title,
  years: v.years.map((y) => ({
    ...y,
    scores: { ...y.scores },
    goals: y.goals.map((g) => ({ ...g })),
    keywords: [...y.keywords],
  })),
});

export const usePlanEditor = (opts?: UsePlanEditorOptions) => {
  const resolvedInitialValues = useMemo(
    () => normalizePlanFormValues(opts?.initialValues),
    [opts?.initialValues],
  );

  const [values, setValues] = useState<PlanFormValues>(resolvedInitialValues);

  /** When `initialValues` prop identity changes, reset form (avoids setState inside useEffect). */
  const initialPropRef = useRef(opts?.initialValues);
  if (opts?.initialValues !== initialPropRef.current) {
    initialPropRef.current = opts?.initialValues;
    if (opts?.initialValues != null) {
      setValues(cloneValues(normalizePlanFormValues(opts.initialValues)));
    }
  }

  const validation = useMemo(() => validatePlanForm(values), [values]);

  const resetForm = useCallback(
    (nextValues?: PlanFormValues) => {
      setValues(
        cloneValues(
          nextValues
            ? normalizePlanFormValues(nextValues)
            : resolvedInitialValues,
        ),
      );
    },
    [resolvedInitialValues],
  );

  const setTitle = useCallback((title: string) => {
    setValues((prev) => ({ ...prev, title }));
  }, []);

  const patchYear = useCallback(
    (
      yearIndex: PlanOdysseyYearIndex,
      patch:
        | Partial<PlanYearForm>
        | ((prev: PlanYearForm) => PlanYearForm),
    ) => {
      setValues((prev) => ({
        ...prev,
        years: prev.years.map((y) => {
          if (y.yearIndex !== yearIndex) return y;
          const next =
            typeof patch === "function" ? patch(y) : { ...y, ...patch };
          return next;
        }),
      }));
    },
    [],
  );

  const setScore = useCallback(
    (yearIndex: PlanOdysseyYearIndex, key: keyof PlanYearScores, value: number) => {
      patchYear(yearIndex, (y) => ({
        ...y,
        scores: { ...y.scores, [key]: value as PlanYearScores[typeof key] },
      }));
    },
    [patchYear],
  );

  const setGoalLine = useCallback(
    (yearIndex: PlanOdysseyYearIndex, index: number, text: string) => {
      patchYear(yearIndex, (y) => ({
        ...y,
        goals: y.goals.map((g, i) => (i === index ? { ...g, text } : g)),
      }));
    },
    [patchYear],
  );

  const commitGoal = useCallback(
    (yearIndex: PlanOdysseyYearIndex, raw: string) => {
      const t = raw.trim();
      if (!t) return;
      if (t.length > PLAN_MAX_LENGTH.goal) return;
      patchYear(yearIndex, (y) => {
        if (y.goals.length >= PLAN_MAX_GOALS_PER_YEAR) return y;
        return {
          ...y,
          goals: [...y.goals, { id: newPlanGoalId(), text: t }],
        };
      });
    },
    [patchYear],
  );

  const removeGoalLine = useCallback(
    (yearIndex: PlanOdysseyYearIndex, index: number) => {
      patchYear(yearIndex, (y) => ({
        ...y,
        goals: y.goals.filter((_, i) => i !== index),
      }));
    },
    [patchYear],
  );

  const reorderGoals = useCallback(
    (yearIndex: PlanOdysseyYearIndex, nextGoals: PlanGoalLineForm[]) => {
      patchYear(yearIndex, { goals: nextGoals });
    },
    [patchYear],
  );

  const commitKeyword = useCallback(
    (yearIndex: PlanOdysseyYearIndex, raw: string) => {
      const t = raw.trim();
      if (!t) return;
      if (t.length > PLAN_MAX_LENGTH.keyword) return;
      patchYear(yearIndex, (y) => {
        if (y.keywords.length >= PLAN_MAX_KEYWORDS_PER_YEAR) return y;
        return { ...y, keywords: [...y.keywords, t] };
      });
    },
    [patchYear],
  );

  const removeKeywordLine = useCallback(
    (yearIndex: PlanOdysseyYearIndex, index: number) => {
      patchYear(yearIndex, (y) => ({
        ...y,
        keywords: y.keywords.filter((_, i) => i !== index),
      }));
    },
    [patchYear],
  );

  const setYearNote = useCallback(
    (yearIndex: PlanOdysseyYearIndex, note: string) => {
      patchYear(yearIndex, { note });
    },
    [patchYear],
  );

  return {
    values,
    validation,
    resetForm,
    setTitle,
    setScore,
    setGoalLine,
    commitGoal,
    removeGoalLine,
    reorderGoals,
    commitKeyword,
    removeKeywordLine,
    setYearNote,
  };
};
