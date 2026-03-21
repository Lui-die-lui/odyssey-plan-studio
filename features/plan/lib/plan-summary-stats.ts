import type { PlanOdysseyYearIndex } from "../constants/plan.constants";
import type { PlanYearDto, PlanYearScores } from "../types/plan.types";

const SCORE_KEYS = [
  "resources",
  "interest",
  "confidence",
  "coherence",
] as const satisfies readonly (keyof PlanYearScores)[];

export type PlanSummaryCategoryKey = (typeof SCORE_KEYS)[number];

export function yearAverageDistance(scores: PlanYearScores): number {
  const sum = SCORE_KEYS.reduce((acc, k) => acc + scores[k], 0);
  return sum / SCORE_KEYS.length;
}

export function formatDistanceOneDecimal(n: number): string {
  return n.toFixed(1);
}

export function computeCategoryAverages(
  years: PlanYearDto[],
): Record<PlanSummaryCategoryKey, number> {
  const acc = {
    resources: 0,
    interest: 0,
    confidence: 0,
    coherence: 0,
  };
  const n = years.length || 1;
  for (const y of years) {
    for (const k of SCORE_KEYS) {
      acc[k] += y.scores[k];
    }
  }
  return {
    resources: acc.resources / n,
    interest: acc.interest / n,
    confidence: acc.confidence / n,
    coherence: acc.coherence / n,
  };
}

export function overallAverageDistance(years: PlanYearDto[]): number {
  if (!years.length) return 0;
  const sum = years.reduce((s, y) => s + yearAverageDistance(y.scores), 0);
  return sum / years.length;
}

export function highestAndLowestCategory(
  avgs: Record<PlanSummaryCategoryKey, number>,
): { highest: PlanSummaryCategoryKey; lowest: PlanSummaryCategoryKey } {
  let highest: PlanSummaryCategoryKey = SCORE_KEYS[0];
  let lowest: PlanSummaryCategoryKey = SCORE_KEYS[0];
  for (const k of SCORE_KEYS) {
    if (avgs[k] > avgs[highest]) highest = k;
    if (avgs[k] < avgs[lowest]) lowest = k;
  }
  return { highest, lowest };
}

/** 년도별 평균 거리가 가장 높은 해 (동점이면 더 이른 년차). */
export function yearWithHighestAverage(
  years: PlanYearDto[],
): PlanOdysseyYearIndex | null {
  if (!years.length) return null;
  let best = years[0]!;
  let bestAvg = yearAverageDistance(best.scores);
  for (let i = 1; i < years.length; i++) {
    const y = years[i]!;
    const a = yearAverageDistance(y.scores);
    if (a > bestAvg) {
      best = y;
      bestAvg = a;
    }
  }
  return best.yearIndex;
}
