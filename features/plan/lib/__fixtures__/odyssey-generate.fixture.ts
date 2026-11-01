import type { OdysseyInterviewAnswers } from "../../interview/odyssey-interview.types";
import type { PlanPathKind } from "../../constants/plan-path.constants";

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
    q_assets: { choiceIds: ["q_assets_none"] },
    q_time: { choiceIds: ["q_time_mid"] },
    q_limits: { choiceIds: ["q_limits_schedule"] },
    q8: { choiceIds: ["q8_skip"] },
    q11: { choiceIds: ["q11_balance"] },
    q_path_a: { choiceIds: ["q_path_a_deepen"] },
    q_path_b: { choiceIds: ["q_path_b_postponed"] },
    q_path_c: { choiceIds: ["q_path_c_create"] },
    ...overrides,
  });

export const answeredIds = new Set([
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q_assets",
  "q_time",
  "q_limits",
  "q8",
  "q11",
  "q_path_a",
  "q_path_b",
  "q_path_c",
]);

const PATH_THEMES: Record<PlanPathKind, string> = {
  continue: "지금 하던 일에서 맡은 범위 넓히기",
  alternative: "미뤄 둔 도예 수업 듣고 공방 사람들 만나기",
  unbound: "한 달씩 다른 도시에서 그림 그리며 지내기",
};

export const validYear = (yearIndex: number, kind: PlanPathKind = "continue") => ({
  yearIndex,
  goal: `${yearIndex}년차에는 ${PATH_THEMES[kind]}를 직접 겪어 본 상태가 됩니다.`,
  actions: [`${yearIndex}년차에 주 3시간 안에서 ${PATH_THEMES[kind]}를 시험합니다.`],
  checkpoint: `${yearIndex}년차 확인: 기록과 받은 피드백을 정리합니다.`,
  evidence: {
    questionIds: ["q_path_a", "q_time"],
    explanation: "방향과 주당 가용 시간을 답했습니다.",
  },
  pivotCondition: "맞지 않으면 다른 경로와 비교합니다.",
  keywords: ["기록"],
  briefGoal: "직접 겪어 본 상태",
  briefAction: "주 3시간 시험하기",
});

export const validPath = (kind: PlanPathKind) => ({
  kind,
  title: `${kind} 경로`,
  overview: `${PATH_THEMES[kind]}를 중심으로 지내는 5년입니다.`,
  tagline: PATH_THEMES[kind],
  credentialNote: "자격증보다 실습 우선",
  appeal: { text: "답변과 연결됩니다.", questionIds: ["q_path_a"] },
  requirements: ["주 3시간"],
  openQuestions: ["이 생활이 나에게 맞을까요?"],
  experiments: [{ action: "관련 일을 하는 사람과 대화합니다.", learning: "실제 하루가 어떤지" }],
  preparations: [],
  years: [1, 2, 3, 4, 5].map((y) => validYear(y, kind)),
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
    differenceNote: "",
  },
  planForm: {
    title: "세 가지 5년",
    paths: (["continue", "alternative", "unbound"] as const).map(validPath),
    sharedPreparations: [],
  },
});
