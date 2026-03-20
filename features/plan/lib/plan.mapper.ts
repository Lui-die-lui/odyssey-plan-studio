import type {
  PlanFormValues,
  SavePlanRequestPayload,
  UpdatePlanRequestPayload,
  SavedPlanResponse,
  YearlyPlanItemForm,
  YearlyPlanItem,
} from "../types/plan.types";

const normalizeText = (value: string | undefined | null) => {
  return (value ?? "").trim();
};

const normalizeOptionalString = (value: string | undefined) => {
  const trimmed = normalizeText(value);
  return trimmed.length ? trimmed : undefined;
};

const normalizeOptionalStringArray = (values?: string[]) => {
  if (!values?.length) return undefined;

  const cleaned = values
    .map((v) => normalizeText(v))
    .filter((v) => v.length > 0);

  return cleaned.length ? cleaned : undefined;
};

export const mapYearlyPlanItemFormToPayload = (
  item: YearlyPlanItemForm,
): YearlyPlanItemForm => {
  return {
    year: item.year,
    goal: normalizeText(item.goal),
    summary: normalizeText(item.summary),
    strengths: normalizeOptionalStringArray(item.strengths),
    weaknesses: normalizeOptionalStringArray(item.weaknesses),
  };
};

export const mapPlanFormValuesToSavePayload = (
  values: PlanFormValues,
): SavePlanRequestPayload => {
  return {
    title: normalizeOptionalString(values.title),
    yearlyItems: values.yearlyItems.map(mapYearlyPlanItemFormToPayload),
  };
};

export const mapPlanFormValuesToUpdatePayload = (
  planId: string,
  values: PlanFormValues,
): UpdatePlanRequestPayload => {
  return {
    planId,
    title: normalizeOptionalString(values.title),
    yearlyItems: values.yearlyItems.map(mapYearlyPlanItemFormToPayload),
  };
};

export const mapYearlyPlanItemToForm = (item: YearlyPlanItem): YearlyPlanItemForm => {
  return {
    year: item.year,
    goal: normalizeText(item.goal),
    summary: normalizeText(item.summary),
    strengths: normalizeOptionalStringArray(item.strengths),
    weaknesses: normalizeOptionalStringArray(item.weaknesses),
  };
};

export const mapSavedPlanResponseToForm = (
  response: SavedPlanResponse,
): PlanFormValues => {
  return {
    title: normalizeOptionalString(response.title),
    yearlyItems: response.yearlyItems.map(mapYearlyPlanItemToForm),
  };
};

export const mapSavedPlanResponseToEditFormValues = (
  response: SavedPlanResponse,
): PlanFormValues => {
  // Editing screens expect stable arrays for bullet lists.
  const yearlyItems = response.yearlyItems.map((item) => {
    const strengths = normalizeOptionalStringArray(item.strengths) ?? [];
    const weaknesses = normalizeOptionalStringArray(item.weaknesses) ?? [];

    return {
      year: item.year,
      goal: normalizeText(item.goal),
      summary: normalizeText(item.summary),
      strengths,
      weaknesses,
    };
  });

  return {
    title: normalizeOptionalString(response.title),
    yearlyItems,
  };
};