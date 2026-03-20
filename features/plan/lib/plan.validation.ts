import type {
  PlanFormValues,
  YearlyPlanItemForm,
} from "../types/plan.types";
import {
  PLAN_DEFAULTS,
  PLAN_MAX_LENGTH,
} from "../constants/plan.constants";

export type BulletValidationError = {
  index: number;
  message: string;
};

export type YearlyPlanItemValidationErrors = {
  year?: string;
  goal?: string;
  summary?: string;
  strengths?: BulletValidationError[];
  weaknesses?: BulletValidationError[];
};

export type PlanFormValidationErrors = {
  title?: string;
  yearlyItems: YearlyPlanItemValidationErrors[];
  form?: string;
};

export type PlanFormValidationResult = {
  isValid: boolean;
  errors: PlanFormValidationErrors;
};

const getTextLengthError = (opts: {
  label: string;
  value: string;
  maxLength: number;
}) => {
  const trimmed = opts.value.trim();
  if (!trimmed) return undefined;

  if (trimmed.length > opts.maxLength) {
    return `${opts.label} must be at most ${opts.maxLength} characters.`;
  }

  return undefined;
};

const validateBulletList = (opts: {
  label: string;
  bullets?: string[];
}): BulletValidationError[] | undefined => {
  if (!opts.bullets || !Array.isArray(opts.bullets)) return undefined;

  const errors: BulletValidationError[] = [];
  opts.bullets.forEach((raw, index) => {
    const value = typeof raw === "string" ? raw.trim() : "";

    // Treat empty bullets as "not provided". (The UI can still allow adding
    // bullets progressively without immediately failing validation.)
    if (!value) return;

    if (value.length > PLAN_MAX_LENGTH.bulletItem) {
      errors.push({
        index,
        message: `${opts.label} item must be at most ${PLAN_MAX_LENGTH.bulletItem} characters.`,
      });
    }
  });

  return errors.length > 0 ? errors : undefined;
};

const validateYearlyPlanItemForm = (
  item: YearlyPlanItemForm,
): YearlyPlanItemValidationErrors => {
  const errors: YearlyPlanItemValidationErrors = {};

  if (!Number.isFinite(item.year)) {
    errors.year = PLAN_DEFAULTS.missingYearMessage;
  }

  const goal = item.goal ?? "";
  if (!goal.trim()) {
    errors.goal = PLAN_DEFAULTS.missingGoalMessage;
  } else {
    const goalLengthError = getTextLengthError({
      label: "Goal",
      value: goal,
      maxLength: PLAN_MAX_LENGTH.goal,
    });
    if (goalLengthError) errors.goal = goalLengthError;
  }

  const summary = item.summary ?? "";
  if (!summary.trim()) {
    errors.summary = "Please enter a yearly summary.";
  } else {
    const summaryLengthError = getTextLengthError({
      label: "Summary",
      value: summary,
      maxLength: PLAN_MAX_LENGTH.summary,
    });
    if (summaryLengthError) errors.summary = summaryLengthError;
  }

  const strengthsErrors = validateBulletList({
    label: "Strength",
    bullets: item.strengths,
  });
  if (strengthsErrors) errors.strengths = strengthsErrors;

  const weaknessesErrors = validateBulletList({
    label: "Weakness",
    bullets: item.weaknesses,
  });
  if (weaknessesErrors) errors.weaknesses = weaknessesErrors;

  return errors;
};

export const validatePlanForm = (
  values: PlanFormValues,
): PlanFormValidationResult => {
  const yearlyItems = values.yearlyItems ?? [];
  const errors: PlanFormValidationErrors = {
    title: undefined,
    yearlyItems: [],
    form: undefined,
  };

  const title = values.title ?? "";
  const titleTrimmed = title.trim();
  if (titleTrimmed) {
    const titleLengthError = getTextLengthError({
      label: "Title",
      value: titleTrimmed,
      maxLength: PLAN_MAX_LENGTH.title,
    });
    if (titleLengthError) errors.title = titleLengthError;
  }

  if (!yearlyItems.length) {
    errors.form = "Please add at least one yearly item.";
  }

  errors.yearlyItems = yearlyItems.map((item) =>
    validateYearlyPlanItemForm(item),
  );

  const hasAnyError = [
    errors.title,
    errors.form,
    ...errors.yearlyItems.flatMap((y) => [
      y.year,
      y.goal,
      y.summary,
      y.strengths?.length ? "strengths" : undefined,
      y.weaknesses?.length ? "weaknesses" : undefined,
    ]),
  ].some(Boolean);

  return {
    isValid: !hasAnyError,
    errors,
  };
};

