import { ODYSSEY_INTERVIEW_QUESTIONS, getOdysseyChoices } from "./odyssey-interview.flow";
import type { OdysseyInterviewAnswers } from "./odyssey-interview.types";
import { ODYSSEY_OTHER_CHOICE_ID } from "./odyssey-interview.types";

/** 모델 입력용: 질문 문구 + 사용자가 고른 라벨·직접 입력만 나열 */
export function formatOdysseyAnswersForModel(answers: OdysseyInterviewAnswers): string {
  const blocks: string[] = [];

  for (const q of ODYSSEY_INTERVIEW_QUESTIONS) {
    if (q.type === "complete") continue;
    const a = answers[q.id];
    if (!a) continue;

    const opts = getOdysseyChoices(q, answers);
    const choiceLabels = a.choiceIds
      .filter((id) => id !== ODYSSEY_OTHER_CHOICE_ID)
      .map((id) => opts.find((c) => c.id === id)?.label ?? id);

    const hasOther = a.choiceIds.includes(ODYSSEY_OTHER_CHOICE_ID);
    const trimmedText = a.text?.trim();

    let answerLine = choiceLabels.join(", ");
    if (trimmedText) {
      answerLine = answerLine ? `${answerLine} (${trimmedText})` : trimmedText;
    } else if (hasOther) {
      answerLine = answerLine || "(직접 입력)";
    }

    blocks.push(`- 질문: ${q.prompt}\n  답변: ${answerLine || "(없음)"}`);
  }

  return blocks.join("\n\n");
}
