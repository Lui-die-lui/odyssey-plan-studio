import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
import type { PlanPathKind, PlanPathMark } from "../constants/plan-path.constants";
import type {
  PlanPreparationKind,
  PlanPreparationPriority,
} from "../constants/plan-preparation.constants";
import type { PlanScoreKey } from "../constants/plan-score.constants";

/** 1–5 self-rating; higher is more positive (RESOURCES, INTEREST, …). */
export type PlanDistanceScore = 1 | 2 | 3 | 4 | 5;

/** `null` means not rated yet, which is different from a rating of 1. */
export type PlanYearScores = Record<PlanScoreKey, PlanDistanceScore | null>;

/**
 * Explanation kept from AI generation. `sourceGoalTexts` is the generated goal
 * and actions, compared with the current goals to detect later edits.
 */
export type PlanYearAiGuidance = {
  sourceGoalTexts: string[];
  checkpoint: string;
  rationale: string;
  evidenceQuestionIds: string[];
  pivotCondition: string;
};

/** API + persisted shape for one odyssey year. */
export type PlanYearGoalDto = {
  id: string;
  position: number;
  text: string;
};

export type PlanYearKeywordDto = {
  id: string;
  position: number;
  text: string;
};

export type PlanYearDto = {
  id: string;
  yearIndex: PlanOdysseyYearIndex;
  note?: string;
  scores: PlanYearScores;
  /** Scores saved before self-rating existed; their author cannot be determined. */
  unverifiedScoreKeys: PlanScoreKey[];
  goals: PlanYearGoalDto[];
  keywords: PlanYearKeywordDto[];
  aiGuidance?: PlanYearAiGuidance;
};

export type PlanPathExperiment = {
  action: string;
  learning: string;
  /** The user chose this as something to try first. */
  nextUp: boolean;
};

export type PlanPreparation = {
  /** Set only for verified catalog entries; links and status come from the catalog. */
  catalogId: string | null;
  title: string;
  kind: PlanPreparationKind;
  priority: PlanPreparationPriority;
  reason: string;
  basis: string;
  evidenceQuestionIds: string[];
  checkpoint: string;
  conditions: string;
  alternative: string;
};

/** Everything about a path except its years. */
export type PlanPathContent = {
  kind: PlanPathKind;
  title: string;
  overview: string;
  appeal: string;
  appealQuestionIds: string[];
  requirements: string[];
  openQuestions: string[];
  experiments: PlanPathExperiment[];
  preparations: PlanPreparation[];
  /** How the whole path feels now; never copied from yearly scores. */
  scores: PlanYearScores;
  marks: PlanPathMark[];
};

export type PlanPathDto = PlanPathContent & {
  id: string;
  years: PlanYearDto[];
};

export type SavedPlanResponse = {
  planId: string;
  title?: string;
  /** An existing single plan; empty once a plan only has paths. */
  years: PlanYearDto[];
  paths: PlanPathDto[];
  /** Preparation that helps several paths. */
  sharedPreparations: PlanPreparation[];
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Single goal row in the form (id for drag-and-drop + server round-trip). */
export type PlanGoalLineForm = {
  id: string;
  text: string;
};

export type PlanYearForm = {
  yearIndex: PlanOdysseyYearIndex;
  note: string;
  scores: PlanYearScores;
  unverifiedScoreKeys: PlanScoreKey[];
  goals: PlanGoalLineForm[];
  keywords: string[];
  aiGuidance?: PlanYearAiGuidance;
};

export type PlanFormValues = {
  title?: string;
  years: PlanYearForm[];
};

/** Single plan body for POST /api/my-plan. */
export type SingleSavePlanPayload = {
  title?: string;
  years: PlanYearSavePayload[];
};

export type PlanPathSavePayload = PlanPathContent & {
  years: PlanYearSavePayload[];
};

/**
 * Upsert body for POST /api/my-plan. Whichever of `years` and `paths` is left
 * out stays untouched, so saving paths never overwrites a single plan.
 */
export type SavePlanRequestPayload = {
  title?: string;
  years?: PlanYearSavePayload[];
  paths?: PlanPathSavePayload[];
  sharedPreparations?: PlanPreparation[];
};

export type PlanYearSavePayload = {
  yearIndex: PlanOdysseyYearIndex;
  note?: string;
  scores: PlanYearScores;
  unverifiedScoreKeys: PlanScoreKey[];
  /** Ordered; empty strings stripped server-side; max 5 kept. */
  goals: string[];
  keywords: string[];
  aiGuidance?: PlanYearAiGuidance;
};
