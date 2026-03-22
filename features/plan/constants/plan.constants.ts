/** Query flag: user acknowledged replacing an existing plan (new-plan flow under `/plan/new/*`). */
export const NEW_PLAN_REPLACE_QUERY = "replace" as const;
export const NEW_PLAN_REPLACE_VALUE = "1" as const;

export const getNewPlanPath = (acknowledgedReplace: boolean) =>
  acknowledgedReplace
    ? `/plan/new?${NEW_PLAN_REPLACE_QUERY}=${NEW_PLAN_REPLACE_VALUE}`
    : "/plan/new";

/** Odyssey plan tabs: year 1 through year 5 (not calendar years). */
export const PLAN_ODYSSEY_YEAR_INDICES = [1, 2, 3, 4, 5] as const;

export type PlanOdysseyYearIndex = (typeof PLAN_ODYSSEY_YEAR_INDICES)[number];

export const PLAN_MAX_GOALS_PER_YEAR = 5;
export const PLAN_MAX_KEYWORDS_PER_YEAR = 5;

export const PLAN_SCORE_MIN = 1;
export const PLAN_SCORE_MAX = 5;

export const PLAN_MAX_LENGTH = {
  title: 80,
  goal: 200,
  /** 키워드 한 줄 최대 글자 수 (UI: "N자 이내") */
  keyword: 7,
  note: 2000,
} as const;

export const PLAN_DEFAULTS = {
  emptyTitle: "",
  emptyGoalLine: "",
  emptyKeyword: "",
  emptyNote: "",
} as const;
