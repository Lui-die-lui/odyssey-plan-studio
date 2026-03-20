export const PLAN_YEAR_RANGE = {
  /**
   * Start year for generated options (inclusive).
   */
  startOffsetYears: -1,

  /**
   * End year for generated options (inclusive).
   */
  endOffsetYears: 5,
} as const;

export const PLAN_MAX_LENGTH = {
  title: 80,
  goal: 200,
  summary: 400,
  bulletItem: 120,
} as const;

export const PLAN_DEFAULTS = {
  emptyTitle: "",
  emptyGoal: "",
  emptySummary: "",
  emptyStrengths: [] as string[],
  emptyWeaknesses: [] as string[],
  missingYearMessage: "Please choose a year.",
  missingGoalMessage: "Please enter your yearly goal.",
} as const;

export const getPlanYearOptions = (opts?: {
  currentYear?: number;
  startOffsetYears?: number;
  endOffsetYears?: number;
}) => {
  const currentYear =
    typeof opts?.currentYear === "number"
      ? opts.currentYear
      : new Date().getFullYear();

  const startOffsetYears =
    typeof opts?.startOffsetYears === "number"
      ? opts.startOffsetYears
      : PLAN_YEAR_RANGE.startOffsetYears;

  const endOffsetYears =
    typeof opts?.endOffsetYears === "number"
      ? opts.endOffsetYears
      : PLAN_YEAR_RANGE.endOffsetYears;

  const years: number[] = [];
  for (
    let y = currentYear + startOffsetYears;
    y <= currentYear + endOffsetYears;
    y += 1
  ) {
    years.push(y);
  }

  return years;
};

export const PLAN_YEAR_OPTIONS = getPlanYearOptions();

