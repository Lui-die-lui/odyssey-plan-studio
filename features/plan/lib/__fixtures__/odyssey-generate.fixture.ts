import type { OdysseyInterviewAnswers } from "../../interview/odyssey-interview.types";
import { ODYSSEY_OTHER_CHOICE_ID } from "../../interview/odyssey-interview.types";

type AnswerInput = { choiceIds?: string[]; text?: string };

export function buildAnswers(input: Record<string, AnswerInput>): OdysseyInterviewAnswers {
  return Object.fromEntries(
    Object.entries(input).map(([questionId, answer]) => [
      questionId,
      {
        questionId,
        type: "single",
        choiceIds: answer.choiceIds ?? [],
        text: answer.text,
        answeredAt: "2026-11-01T00:00:00.000Z",
      },
    ]),
  );
}

/** Common path up to q6 with no study plan, ending before the new questions. */
export const baseAnswers = {
  q1: { choiceIds: ["q1_work"] },
  q2: { choiceIds: ["q2_change"] },
  q3: { choiceIds: ["q3ch_passion"] },
  q4: { choiceIds: ["q4_learn"] },
  q5: { choiceIds: ["q5_overwork"] },
  q6: { choiceIds: ["q6_no"] },
} satisfies Record<string, AnswerInput>;

export const fullAnswers = (overrides: Record<string, AnswerInput> = {}) =>
  buildAnswers({
    ...baseAnswers,
    q_goal: { choiceIds: [ODYSSEY_OTHER_CHOICE_ID], text: "일러스트 작업으로 전환" },
    q_assets: { choiceIds: ["q_assets_none"] },
    q_time: { choiceIds: ["q_time_mid"] },
    q_limits: { choiceIds: ["q_limits_schedule"] },
    q8: { choiceIds: ["q8_skip"] },
    q11: { choiceIds: ["q11_balance"] },
    ...overrides,
  });

export const answeredIds = new Set([
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q_goal",
  "q_assets",
  "q_time",
  "q_limits",
  "q8",
  "q11",
]);

export const validYear = (yearIndex: number) => ({
  yearIndex,
  goal: `${yearIndex}년차에는 작업 방식을 직접 확인한 상태가 됩니다.`,
  actions: [`${yearIndex}년차 행동: 주 3시간 안에서 작은 작업물 하나를 완성합니다.`],
  checkpoint: `${yearIndex}년차 확인: 완성한 작업물과 받은 피드백을 기록합니다.`,
  evidence: {
    questionIds: ["q_goal", "q_time"],
    explanation: "전환 목표와 주당 가용 시간을 답했습니다.",
  },
  pivotCondition: "피드백이 맞지 않으면 다른 방향과 비교합니다.",
  keywords: ["작업물"],
});

export const validResponse = () => ({
  summary: {
    headline: "일과 병행하며 전환을 시험해 보는 초안",
    summary: "답변을 근거로 정리했습니다.",
    facts: [{ text: "방향을 바꾸고 싶다고 답했습니다.", questionIds: ["q2"] }],
    interpretations: [],
    missingInfo: [],
    avoidNotes: [],
    keywords: [],
  },
  planForm: {
    title: "병행 전환 실험 계획",
    years: [1, 2, 3, 4, 5].map(validYear),
  },
});
