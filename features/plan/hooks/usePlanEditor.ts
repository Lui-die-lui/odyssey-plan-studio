"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  PlanDistanceScore,
  PlanFormValues,
  PlanGoalLineForm,
  PlanYearForm,
} from "../types/plan.types";
import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
import type { PlanScoreKey } from "../constants/plan-score.constants";
import { validatePlanForm } from "../lib/plan.validation";
import {
  mapPlanFormValuesToSavePayload,
  normalizePlanFormValues,
} from "../lib/plan.mapper";
import {
  clearPlanFormAutosave,
  readPlanFormAutosave,
  writePlanFormAutosave,
} from "../lib/plan-form-autosave";
import { newPlanGoalId } from "../lib/plan-goal-id";
import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
} from "../constants/plan.constants";

type UsePlanEditorOptions = {
  initialValues?: PlanFormValues;
  /** Keeps unsaved edits in this tab; omit until the plan being edited is known. */
  autosaveKey?: string;
};

const fingerprint = (values: PlanFormValues) =>
  JSON.stringify(mapPlanFormValuesToSavePayload(values));

const cloneValues = (v: PlanFormValues): PlanFormValues => ({
  title: v.title,
  years: v.years.map((y) => ({
    ...y,
    scores: { ...y.scores },
    unverifiedScoreKeys: [...y.unverifiedScoreKeys],
    goals: y.goals.map((g) => ({ ...g })),
    keywords: [...y.keywords],
  })),
});

export const usePlanEditor = (opts?: UsePlanEditorOptions) => {
  const autosaveKey = opts?.autosaveKey;
  const resolvedInitialValues = useMemo(
    () => normalizePlanFormValues(opts?.initialValues),
    [opts?.initialValues],
  );

  const [values, setValues] = useState<PlanFormValues>(
    () => (autosaveKey && readPlanFormAutosave(autosaveKey)) || resolvedInitialValues,
  );
  const [restored, setRestored] = useState(
    () => autosaveKey != null && readPlanFormAutosave(autosaveKey) != null,
  );

  /** When `initialValues` prop identity changes, reset form (avoids setState inside useEffect). */
  const initialPropRef = useRef(opts?.initialValues);
  if (opts?.initialValues !== initialPropRef.current) {
    initialPropRef.current = opts?.initialValues;
    if (opts?.initialValues != null) {
      const saved = autosaveKey ? readPlanFormAutosave(autosaveKey) : null;
      setValues(saved ?? cloneValues(normalizePlanFormValues(opts.initialValues)));
      setRestored(saved != null);
    }
  }

  const validation = useMemo(() => validatePlanForm(values), [values]);
  const isDirty = useMemo(
    () => fingerprint(values) !== fingerprint(resolvedInitialValues),
    [values, resolvedInitialValues],
  );

  useEffect(() => {
    if (!autosaveKey) return;
    if (isDirty) writePlanFormAutosave(autosaveKey, values);
    else clearPlanFormAutosave(autosaveKey);
  }, [autosaveKey, isDirty, values]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const resetForm = useCallback(
    (nextValues?: PlanFormValues) => {
      setRestored(false);
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

  const clearAutosave = useCallback(() => {
    if (autosaveKey) clearPlanFormAutosave(autosaveKey);
  }, [autosaveKey]);

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
    (
      yearIndex: PlanOdysseyYearIndex,
      key: PlanScoreKey,
      value: PlanDistanceScore | null,
    ) => {
      patchYear(yearIndex, (y) => ({
        ...y,
        scores: { ...y.scores, [key]: value },
        // The user has now decided this score, so it is no longer of unknown origin.
        unverifiedScoreKeys: y.unverifiedScoreKeys.filter((k) => k !== key),
      }));
    },
    [patchYear],
  );

  const confirmUnverifiedScores = useCallback(
    (yearIndex: PlanOdysseyYearIndex) => {
      patchYear(yearIndex, { unverifiedScoreKeys: [] });
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
    isDirty,
    restored,
    clearAutosave,
    resetForm,
    setTitle,
    setScore,
    confirmUnverifiedScores,
    setGoalLine,
    commitGoal,
    removeGoalLine,
    reorderGoals,
    commitKeyword,
    removeKeywordLine,
    setYearNote,
  };
};
