import { getOdysseyQuestionById } from "../interview/odyssey-interview.flow";
import type { PlanYearAiGuidance } from "../types/plan.types";

const normalizedSet = (texts: string[]) =>
  texts
    .map((t) => t.trim())
    .filter(Boolean)
    .sort();

/**
 * 생성 당시 문장과 현재 목표가 다른지 확인합니다. 순서만 바꾼 경우는 내용 변경이 아닙니다.
 * 달라졌다면 근거는 편집 전 내용 기준이고, AI가 다시 확인한 것이 아닙니다.
 */
export function isAiGuidanceOutdated(
  guidance: PlanYearAiGuidance,
  currentGoalTexts: string[],
): boolean {
  const source = normalizedSet(guidance.sourceGoalTexts);
  const current = normalizedSet(currentGoalTexts);
  return (
    source.length !== current.length ||
    source.some((text, index) => text !== current[index])
  );
}

/** 저장된 ID를 질문 문구로 바꿉니다. 현재 플로우에 없는 ID는 표시하지 않습니다. */
export function describeEvidenceQuestions(questionIds: string[]): string[] {
  return questionIds.flatMap((id) => getOdysseyQuestionById(id)?.prompt ?? []);
}

export const AI_GUIDANCE_OUTDATED_NOTE =
  "목표를 편집한 뒤로 이 설명은 편집 전 내용을 기준으로 합니다. AI가 다시 확인한 내용이 아닙니다.";
export const AI_SUGGESTION_LABEL = "AI 제안";
