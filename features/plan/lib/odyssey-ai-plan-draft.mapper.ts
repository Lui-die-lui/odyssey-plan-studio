import type { PlanFormValues, PlanYearForm } from "../types/plan.types";
import { PLAN_ODYSSEY_YEAR_INDICES } from "../constants/plan.constants";
import type {
  OdysseyAiSinglePlanDraft,
  OdysseyLegacyAiPlanFormDraft,
} from "../interview/odyssey-ai-plan-draft.types";
import { createEmptyPlanYearForm, normalizePlanFormValues } from "./plan.mapper";
import { newPlanGoalId } from "./plan-goal-id";

const toGoalLines = (texts: string[]) =>
  texts.map((text) => ({ id: newPlanGoalId(), text }));

/**
 * 검증된 AI `planForm` → `PlanFormValues`.
 * goal과 actions는 편집 가능한 목표 줄이 되고, 생성 당시 문장은 `sourceGoalTexts`로 남겨
 * 이후 사용자가 바꿨는지 비교합니다. 점수는 사용자가 평가할 때까지 미평가입니다.
 */
export function mapOdysseyAiPlanFormToPlanFormValues(
  draft: OdysseyAiSinglePlanDraft,
): PlanFormValues {
  const byIndex = new Map(draft.years.map((y) => [y.yearIndex, y]));

  const years: PlanYearForm[] = PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
    const row = byIndex.get(idx);
    if (!row) return createEmptyPlanYearForm(idx);

    const goalTexts = [row.goal, ...row.actions];
    return {
      ...createEmptyPlanYearForm(idx),
      goals: toGoalLines(goalTexts),
      keywords: row.keywords,
      aiGuidance: {
        sourceGoalTexts: goalTexts,
        checkpoint: row.checkpoint,
        rationale: row.evidence.explanation,
        evidenceQuestionIds: row.evidence.questionIds,
        pivotCondition: row.pivotCondition,
        briefGoal: row.briefGoal,
        briefAction: row.briefAction,
      },
    };
  });

  return normalizePlanFormValues({ title: draft.title, years });
}

/** v1 초안은 문장만 살립니다. AI가 만든 점수는 옮기지 않아 미평가로 시작합니다. */
export function mapOdysseyLegacyAiPlanFormToPlanFormValues(
  draft: OdysseyLegacyAiPlanFormDraft,
): PlanFormValues {
  const byIndex = new Map(draft.years.map((y) => [y.yearIndex, y]));

  const years: PlanYearForm[] = PLAN_ODYSSEY_YEAR_INDICES.map((idx) => {
    const row = byIndex.get(idx);
    if (!row) return createEmptyPlanYearForm(idx);
    return {
      ...createEmptyPlanYearForm(idx),
      note: row.note ?? "",
      goals: toGoalLines(row.plans),
      keywords: row.keywords,
    };
  });

  return normalizePlanFormValues({ title: draft.title, years });
}
