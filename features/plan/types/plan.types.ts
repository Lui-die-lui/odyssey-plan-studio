export type YearlyPlanItemForm = {
  /**
   * The year this entry belongs to (e.g., 2026).
   */
  year: number;

  /**
   * The main goal for the year.
   */
  goal: string;

  /**
   * A short summary for the year.
   */
  summary: string;

  /**
   * Optional list of strengths to focus on.
   */
  strengths?: string[];

  /**
   * Optional list of weaknesses to improve.
   */
  weaknesses?: string[];
};

export type YearlyPlanItem = YearlyPlanItemForm & {
  /**
   * Optional database id (if the backend stores per-year entries).
   */
  id?: string;
};

export type PlanFormValues = {
  /**
   * Optional display title for the whole plan.
   */
  title?: string;

  /**
   * Year-by-year items that the user edits/creates.
   */
  yearlyItems: YearlyPlanItemForm[];
};

export type SavedPlanResponse = {
  /**
   * Unique id for the plan.
   */
  planId: string;

  /**
   * Optional title if stored by the backend.
   */
  title?: string;

  /**
   * Year-by-year saved entries.
   */
  yearlyItems: YearlyPlanItem[];

  /**
   * Helpful metadata if provided by the backend.
   */
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SavePlanRequestPayload = {
  title?: string;
  yearlyItems: YearlyPlanItemForm[];
};

export type UpdatePlanRequestPayload = {
  planId: string;
  title?: string;
  yearlyItems: YearlyPlanItemForm[];
};

