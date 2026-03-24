import type { PlanFormValues, PlanYearForm } from "../types/plan.types";
import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
  PLAN_SCORE_MAX,
  PLAN_SCORE_MIN,
} from "../constants/plan.constants";

export type StringListItemError = {
  index: number;
  message: string;
};

export type PlanYearFormValidationErrors = {
  note?: string;
  scores?: Partial<Record<keyof PlanYearForm["scores"], string>>;
  goals?: string;
  goalLines?: StringListItemError[];
  keywords?: string;
  keywordLines?: StringListItemError[];
};

export type PlanFormValidationErrors = {
  title?: string;
  years: PlanYearFormValidationErrors[];
  form?: string;
};

export type PlanFormValidationResult = {
  isValid: boolean;
  errors: PlanFormValidationErrors;
};

const clampScore = (n: number): number =>
  Math.min(PLAN_SCORE_MAX, Math.max(PLAN_SCORE_MIN, Math.round(n)));

const validateScoreField = (
  value: number,
  label: string,
): string | undefined => {
  const v = clampScore(Number(value));
  if (v < PLAN_SCORE_MIN || v > PLAN_SCORE_MAX) {
    return `${label} must be between ${PLAN_SCORE_MIN} and ${PLAN_SCORE_MAX}.`;
  }
  return undefined;
};

const validateTextList = (opts: {
  items: string[];
  maxItems: number;
  maxLen: number;
  label: string;
}): { listError?: string; lineErrors?: StringListItemError[] } => {
  const nonEmpty = opts.items.map((s) => (typeof s === "string" ? s.trim() : ""));
  const used = nonEmpty.filter(Boolean);
  if (used.length > opts.maxItems) {
    return {
      listError: `At most ${opts.maxItems} ${opts.label} allowed.`,
    };
  }
  const lineErrors: StringListItemError[] = [];
  nonEmpty.forEach((line, index) => {
    if (!line) return;
    if (line.length > opts.maxLen) {
      lineErrors.push({
        index,
        message: `Must be at most ${opts.maxLen} characters.`,
      });
    }
  });
  return lineErrors.length ? { lineErrors } : {};
};

const validateYear = (y: PlanYearForm): PlanYearFormValidationErrors => {
  const errors: PlanYearFormValidationErrors = {};

  const note = y.note?.trim() ?? "";
  if (note.length > PLAN_MAX_LENGTH.note) {
    errors.note = `Note must be at most ${PLAN_MAX_LENGTH.note} characters.`;
  }

  const scoreErrors: PlanYearFormValidationErrors["scores"] = {};
  const s = y.scores;
  (
    [
      ["resources", s.resources, "Resources"],
      ["interest", s.interest, "Interest"],
      ["confidence", s.confidence, "Confidence"],
      ["coherence", s.coherence, "Coherence"],
    ] as const
  ).forEach(([key, val, label]) => {
    const err = validateScoreField(val, label);
    if (err) scoreErrors[key] = err;
  });
  if (Object.keys(scoreErrors).length) errors.scores = scoreErrors;

  const goalCheck = validateTextList({
    items: y.goals.map((g) => g.text),
    maxItems: PLAN_MAX_GOALS_PER_YEAR,
    maxLen: PLAN_MAX_LENGTH.goal,
    label: "goals",
  });
  if (goalCheck.listError) errors.goals = goalCheck.listError;
  if (goalCheck.lineErrors) errors.goalLines = goalCheck.lineErrors;

  const kwCheck = validateTextList({
    items: y.keywords,
    maxItems: PLAN_MAX_KEYWORDS_PER_YEAR,
    maxLen: PLAN_MAX_LENGTH.keyword,
    label: "keywords",
  });
  if (kwCheck.listError) errors.keywords = kwCheck.listError;
  if (kwCheck.lineErrors) errors.keywordLines = kwCheck.lineErrors;

  return errors;
};

const yearHasErrors = (e: PlanYearFormValidationErrors) =>
  Boolean(
    e.note ||
      e.goals ||
      e.keywords ||
      e.goalLines?.length ||
      e.keywordLines?.length ||
      (e.scores &&
        Object.values(e.scores).some(Boolean)),
  );

export const validatePlanForm = (
  values: PlanFormValues,
): PlanFormValidationResult => {
  const errors: PlanFormValidationErrors = {
    title: undefined,
    years: [],
    form: undefined,
  };

  const title = values.title?.trim() ?? "";
  if (title.length > PLAN_MAX_LENGTH.title) {
    errors.title = `Title must be at most ${PLAN_MAX_LENGTH.title} characters.`;
  }

  const years = values.years ?? [];
  if (years.length !== PLAN_ODYSSEY_YEAR_INDICES.length) {
    errors.form = "Plan must include all five odyssey years (1–5).";
  }

  errors.years = PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
    const block = years.find((y) => y.yearIndex === idx);
    if (!block) {
      return { goals: "Missing year data." };
    }
    return validateYear(block);
  });

  const goalCount = years.reduce(
    (n, y) =>
      n + y.goals.filter((g) => (g.text ?? "").trim().length > 0).length,
    0,
  );
  if (goalCount === 0) {
    errors.form = "최소 1개 이상의 목표를 추가해주세요.";
  }

  const hasAnyError =
    Boolean(errors.title || errors.form) ||
    errors.years.some(yearHasErrors);

  return {
    isValid: !hasAnyError,
    errors,
  };
};
