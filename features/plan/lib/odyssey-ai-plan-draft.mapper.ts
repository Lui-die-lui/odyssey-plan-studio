import type { PlanDistanceScore, PlanFormValues, PlanYearForm } from "../types/plan.types";
import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
  PLAN_SCORE_MAX,
  PLAN_SCORE_MIN,
} from "../constants/plan.constants";
import type { OdysseyAiPlanFormDraft } from "../interview/odyssey-ai-plan-draft.types";
import { normalizePlanFormValues } from "./plan.mapper";
import { newPlanGoalId } from "./plan-goal-id";

function clampScore(n: unknown): PlanDistanceScore {
  const v = Math.round(Number(n));
  const x = Math.min(PLAN_SCORE_MAX, Math.max(PLAN_SCORE_MIN, v));
  return x as PlanDistanceScore;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

/**
 * AI `planForm` → `PlanFormValues` (기존 폼·normalize 규칙 재사용)
 */
export function mapOdysseyAiPlanFormToPlanFormValues(
  draft: OdysseyAiPlanFormDraft,
): PlanFormValues {
  const byIndex = new Map(draft.years.map((y) => [y.yearIndex, y]));

  const years: PlanYearForm[] = PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
    const row = byIndex.get(idx);
    if (!row) {
      return {
        yearIndex: idx,
        note: "",
        scores: {
          resources: PLAN_SCORE_MIN as PlanDistanceScore,
          interest: PLAN_SCORE_MIN as PlanDistanceScore,
          confidence: PLAN_SCORE_MIN as PlanDistanceScore,
          coherence: PLAN_SCORE_MIN as PlanDistanceScore,
        },
        goals: [],
        keywords: [],
      };
    }

    const goals = (row.plans ?? [])
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, PLAN_MAX_GOALS_PER_YEAR)
      .map((text) => ({
        id: newPlanGoalId(),
        text: truncate(text, PLAN_MAX_LENGTH.goal),
      }));

    const keywords = (row.keywords ?? [])
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, PLAN_MAX_KEYWORDS_PER_YEAR)
      .map((k) => truncate(k, PLAN_MAX_LENGTH.keyword));

    const cs = row.categoryScores;
    return {
      yearIndex: idx,
      note: truncate((row.note ?? "").trim(), PLAN_MAX_LENGTH.note),
      scores: {
        resources: clampScore(cs?.resources),
        interest: clampScore(cs?.interest),
        confidence: clampScore(cs?.confidence),
        coherence: clampScore(cs?.coherence),
      },
      goals,
      keywords,
    };
  });

  const titleRaw = (draft.title ?? "").trim();
  const title = truncate(titleRaw, PLAN_MAX_LENGTH.title);

  return normalizePlanFormValues({
    title: title || undefined,
    years,
  });
}
