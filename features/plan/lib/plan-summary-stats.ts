import {
  PLAN_NOT_COMPARABLE_LABEL,
  PLAN_NO_DIFFERENCE_LABEL,
  PLAN_SCORE_KEYS,
  PLAN_SCORE_LABELS,
  type PlanScoreKey,
} from "../constants/plan-score.constants";
import type { PlanDistanceScore, PlanYearDto, PlanYearScores } from "../types/plan.types";

export type PlanSummaryCategoryKey = PlanScoreKey;

/** 미평가를 제외한 평균. `average`가 null이면 평가가 하나도 없습니다. */
export type PlanRatingSummary = {
  average: number | null;
  ratedCount: number;
  totalCount: number;
};

function summarize(values: (PlanDistanceScore | null)[]): PlanRatingSummary {
  const rated = values.filter((v): v is PlanDistanceScore => v !== null);
  return {
    average: rated.length
      ? rated.reduce((sum, v) => sum + v, 0) / rated.length
      : null,
    ratedCount: rated.length,
    totalCount: values.length,
  };
}

export function formatRatingOneDecimal(n: number): string {
  return n.toFixed(1);
}

export function summarizeYearRating(scores: PlanYearScores): PlanRatingSummary {
  return summarize(PLAN_SCORE_KEYS.map((k) => scores[k]));
}

export function summarizeOverallRating(years: PlanYearDto[]): PlanRatingSummary {
  return summarize(years.flatMap((y) => PLAN_SCORE_KEYS.map((k) => y.scores[k])));
}

export function summarizeCategoryRatings(
  years: PlanYearDto[],
): Record<PlanSummaryCategoryKey, PlanRatingSummary> {
  return {
    resources: summarize(years.map((y) => y.scores.resources)),
    interest: summarize(years.map((y) => y.scores.interest)),
    confidence: summarize(years.map((y) => y.scores.confidence)),
    coherence: summarize(years.map((y) => y.scores.coherence)),
  };
}

export type PlanCategoryComparison =
  /** 항목마다 평가 수가 달라 비교할 수 없음 */
  | { status: "not_comparable" }
  /** 네 항목의 평균이 모두 같음 */
  | { status: "no_difference" }
  /** 동점인 항목은 모두 포함 */
  | {
      status: "compared";
      highest: PlanSummaryCategoryKey[];
      lowest: PlanSummaryCategoryKey[];
    };

/** 네 항목이 같은 수만큼 평가되었을 때만 비교합니다. */
export function compareCategoryRatings(
  ratings: Record<PlanSummaryCategoryKey, PlanRatingSummary>,
): PlanCategoryComparison {
  const [first] = PLAN_SCORE_KEYS.map((k) => ratings[k].ratedCount);
  const comparable =
    first > 0 && PLAN_SCORE_KEYS.every((k) => ratings[k].ratedCount === first);
  if (!comparable) return { status: "not_comparable" };

  const averages = PLAN_SCORE_KEYS.map((k) => ratings[k].average as number);
  const max = Math.max(...averages);
  const min = Math.min(...averages);
  if (max === min) return { status: "no_difference" };

  return {
    status: "compared",
    highest: PLAN_SCORE_KEYS.filter((k) => ratings[k].average === max),
    lowest: PLAN_SCORE_KEYS.filter((k) => ratings[k].average === min),
  };
}

/** Display text for the highest and lowest rows; ties list every tied category. */
export function describeCategoryComparison(comparison: PlanCategoryComparison): {
  highest: string;
  lowest: string;
} {
  if (comparison.status === "not_comparable") {
    return { highest: PLAN_NOT_COMPARABLE_LABEL, lowest: PLAN_NOT_COMPARABLE_LABEL };
  }
  if (comparison.status === "no_difference") {
    return { highest: PLAN_NO_DIFFERENCE_LABEL, lowest: PLAN_NO_DIFFERENCE_LABEL };
  }
  const labels = (keys: PlanSummaryCategoryKey[]) =>
    keys.map((k) => PLAN_SCORE_LABELS[k].en).join(", ");
  return {
    highest: labels(comparison.highest),
    lowest: labels(comparison.lowest),
  };
}

export function countUnverifiedScores(years: PlanYearDto[]): number {
  return years.reduce((n, y) => n + y.unverifiedScoreKeys.length, 0);
}
