import type {
  PlanFormValues,
  PlanGoalLineForm,
  PlanYearDto,
  PlanYearForm,
  PlanYearScores,
  SavedPlanResponse,
  SavePlanRequestPayload,
} from "../types/plan.types";
import {
  PLAN_DEFAULTS,
  PLAN_ODYSSEY_YEAR_INDICES,
  PLAN_SCORE_MAX,
  PLAN_SCORE_MIN,
} from "../constants/plan.constants";
import { newPlanGoalId } from "./plan-goal-id";

const clampScore = (n: number): PlanYearScores["resources"] => {
  const v = Math.round(Number(n));
  const x = Math.min(PLAN_SCORE_MAX, Math.max(PLAN_SCORE_MIN, v));
  return x as PlanYearScores["resources"];
};

const normalizeScores = (s?: Partial<PlanYearScores>): PlanYearScores => ({
  resources: clampScore(s?.resources ?? PLAN_SCORE_MIN),
  interest: clampScore(s?.interest ?? PLAN_SCORE_MIN),
  confidence: clampScore(s?.confidence ?? PLAN_SCORE_MIN),
  coherence: clampScore(s?.coherence ?? PLAN_SCORE_MIN),
});

export const createEmptyPlanYearForm = (
  yearIndex: (typeof PLAN_ODYSSEY_YEAR_INDICES)[number],
): PlanYearForm => ({
  yearIndex,
  note: PLAN_DEFAULTS.emptyNote,
  scores: normalizeScores({}),
  goals: [],
  keywords: [],
});

export const createDefaultPlanFormValues = (): PlanFormValues => ({
  title: PLAN_DEFAULTS.emptyTitle,
  years: PLAN_ODYSSEY_YEAR_INDICES.map(createEmptyPlanYearForm),
});

export const normalizePlanFormValues = (
  initial?: PlanFormValues,
): PlanFormValues => {
  const base = createDefaultPlanFormValues();
  if (!initial?.years?.length) return base;

  return {
    title: initial.title,
    years: PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
      const incoming = initial.years.find((y) => y.yearIndex === idx);
      if (!incoming) return createEmptyPlanYearForm(idx);
      const goals: PlanGoalLineForm[] = (incoming.goals ?? [])
        .map((g) => ({
          id: g.id?.trim() || newPlanGoalId(),
          text: g.text ?? "",
        }))
        .filter((g) => g.text.trim().length > 0);
      return {
        yearIndex: idx,
        note: incoming.note ?? "",
        scores: normalizeScores(incoming.scores),
        goals,
        keywords: (incoming.keywords ?? []).filter(
          (k) => (k ?? "").trim().length > 0,
        ),
      };
    }),
  };
};

export const mapPlanYearDtoToForm = (dto: PlanYearDto): PlanYearForm => ({
  yearIndex: dto.yearIndex,
  note: dto.note ?? "",
  scores: normalizeScores(dto.scores),
  goals:
    dto.goals.length > 0
      ? [...dto.goals]
          .sort((a, b) => a.position - b.position)
          .map((g) => ({ id: g.id, text: g.text }))
      : [],
  keywords:
    dto.keywords.length > 0
      ? [...dto.keywords]
          .sort((a, b) => a.position - b.position)
          .map((k) => k.text)
      : [],
});

export const mapSavedPlanResponseToForm = (
  response: SavedPlanResponse,
): PlanFormValues => {
  const byIndex = new Map(response.years.map((y) => [y.yearIndex, y]));
  return {
    title: response.title,
    years: PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
      const dto = byIndex.get(idx);
      return dto
        ? mapPlanYearDtoToForm(dto)
        : createEmptyPlanYearForm(idx);
    }),
  };
};

export const mapSavedPlanResponseToEditFormValues = mapSavedPlanResponseToForm;

const trimGoalTexts = (goals: PlanGoalLineForm[]) =>
  goals.map((g) => g.text.trim()).filter((g) => g.length > 0);

const trimKeywords = (keywords: string[]) =>
  keywords.map((k) => k.trim()).filter((k) => k.length > 0);

export const mapPlanFormValuesToSavePayload = (
  values: PlanFormValues,
): SavePlanRequestPayload => {
  return {
    title: values.title?.trim() || undefined,
    years: values.years.map((y) => ({
      yearIndex: y.yearIndex,
      note: y.note?.trim() || undefined,
      scores: normalizeScores(y.scores),
      goals: trimGoalTexts(y.goals),
      keywords: trimKeywords(y.keywords),
    })),
  };
};
