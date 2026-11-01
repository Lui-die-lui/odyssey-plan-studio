import { PLAN_PATHS, PLAN_PATH_KINDS, type PlanPathKind } from "../constants/plan-path.constants";
import type { OdysseyAiPlanFormDraft } from "../interview/odyssey-ai-plan-draft.types";
import type {
  PlanFormValues,
  PlanPathContent,
  PlanPathDto,
  PlanPathSavePayload,
  PlanYearScores,
  SavedPlanResponse,
} from "../types/plan.types";
import { mapOdysseyAiPlanFormToPlanFormValues } from "./odyssey-ai-plan-draft.mapper";
import {
  createDefaultPlanFormValues,
  mapPlanFormValuesToSavePayload,
  mapSavedPlanResponseToForm,
} from "./plan.mapper";

/** Editable state of one path: its details, plus the existing year form. */
export type PlanPathForm = {
  content: PlanPathContent;
  values: PlanFormValues;
};

export const UNRATED_SCORES: PlanYearScores = {
  resources: null,
  interest: null,
  confidence: null,
  coherence: null,
};

function emptyContent(kind: PlanPathKind): PlanPathContent {
  return {
    kind,
    title: PLAN_PATHS[kind].name,
    overview: "",
    appeal: "",
    appealQuestionIds: [],
    requirements: [],
    openQuestions: [],
    experiments: [],
    scores: UNRATED_SCORES,
    marks: [],
  };
}

export function createEmptyPathForms(): PlanPathForm[] {
  return PLAN_PATH_KINDS.map((kind) => ({
    content: emptyContent(kind),
    values: { ...createDefaultPlanFormValues(), title: PLAN_PATHS[kind].name },
  }));
}

export function mapAiDraftToPathForms(draft: OdysseyAiPlanFormDraft): PlanPathForm[] {
  return draft.paths.map((path) => ({
    content: {
      ...emptyContent(path.kind),
      title: path.title,
      overview: path.overview,
      appeal: path.appeal.text,
      appealQuestionIds: path.appeal.questionIds,
      requirements: path.requirements,
      openQuestions: path.openQuestions,
      experiments: path.experiments.map((e) => ({ ...e, nextUp: false })),
    },
    values: mapOdysseyAiPlanFormToPlanFormValues({ title: path.title, years: path.years }),
  }));
}

export function mapSavedPathsToForms(plan: SavedPlanResponse): PlanPathForm[] {
  return PLAN_PATH_KINDS.map((kind) => {
    const path = plan.paths.find((p) => p.kind === kind);
    if (!path) return createEmptyPathForms().find((f) => f.content.kind === kind) as PlanPathForm;
    return { content: pathContent(path), values: pathValues(path) };
  });
}

function pathContent(path: PlanPathDto): PlanPathContent {
  return {
    kind: path.kind,
    title: path.title,
    overview: path.overview,
    appeal: path.appeal,
    appealQuestionIds: path.appealQuestionIds,
    requirements: path.requirements,
    openQuestions: path.openQuestions,
    experiments: path.experiments,
    scores: path.scores,
    marks: path.marks,
  };
}

function pathValues(path: PlanPathDto): PlanFormValues {
  return mapSavedPlanResponseToForm({ planId: path.id, title: path.title, years: path.years, paths: [] });
}

export function mapPathFormToSavePayload(form: PlanPathForm): PlanPathSavePayload {
  return {
    ...form.content,
    title: form.values.title?.trim() || PLAN_PATHS[form.content.kind].name,
    years: mapPlanFormValuesToSavePayload(form.values).years,
  };
}
