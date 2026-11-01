import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
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

export type SavedPlanResponse = {
  planId: string;
  title?: string;
  years: PlanYearDto[];
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

/** Upsert body for POST /api/my-plan */
export type SavePlanRequestPayload = {
  title?: string;
  years: PlanYearSavePayload[];
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
