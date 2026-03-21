import type { PlanOdysseyYearIndex } from "../constants/plan.constants";

/** 1–5 scale for “distance” indicators (RESOURCES, INTEREST, …). */
export type PlanDistanceScore = 1 | 2 | 3 | 4 | 5;

export type PlanYearScores = {
  resources: PlanDistanceScore;
  interest: PlanDistanceScore;
  confidence: PlanDistanceScore;
  coherence: PlanDistanceScore;
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
  goals: PlanYearGoalDto[];
  keywords: PlanYearKeywordDto[];
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
  goals: PlanGoalLineForm[];
  keywords: string[];
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
  /** Ordered; empty strings stripped server-side; max 5 kept. */
  goals: string[];
  keywords: string[];
};
