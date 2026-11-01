import { getOdysseyChoices, getOdysseyQuestionById } from "./odyssey-interview.flow";
import { collectActiveOdysseyAnswers } from "./odyssey-interview.logic";
import type { OdysseyInterviewAnswers } from "./odyssey-interview.types";
import { ODYSSEY_OTHER_CHOICE_ID } from "./odyssey-interview.types";

export type OdysseyModelAnswer = {
  questionId: string;
  question: string;
  selected: string[];
  freeText?: string;
};

/** 모델 입력용: 실제 지나온 질문만, 질문 ID와 사용자가 고른 라벨·직접 입력으로 정리합니다. */
export function buildOdysseyModelAnswers(
  answers: OdysseyInterviewAnswers,
): OdysseyModelAnswer[] {
  const active = collectActiveOdysseyAnswers(answers);

  return Object.values(active).flatMap((answer) => {
    const q = getOdysseyQuestionById(answer.questionId);
    if (!q) return [];

    const labels = new Map(getOdysseyChoices(q, active).map((c) => [c.id, c.label]));
    const selected = answer.choiceIds
      .filter((id) => id !== ODYSSEY_OTHER_CHOICE_ID)
      .flatMap((id) => labels.get(id) ?? []);
    const freeText = answer.text?.trim();

    return [
      {
        questionId: q.id,
        question: q.prompt,
        selected,
        ...(freeText ? { freeText } : {}),
      },
    ];
  });
}

/** JSON 문자열로 직렬화해, 답변 안의 문장이 지시문 구조를 깨고 나오지 못하게 합니다. */
export function formatOdysseyAnswersForModel(
  answers: OdysseyInterviewAnswers,
): string {
  const entries = buildOdysseyModelAnswers(answers);
  return entries.length ? JSON.stringify(entries, null, 2) : "";
}
