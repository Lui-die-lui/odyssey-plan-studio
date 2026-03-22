import type {
  OdysseyChoiceOption,
  OdysseyInterviewAnswers,
  OdysseyInterviewQuestionDef,
} from "./odyssey-interview.types";
import { ODYSSEY_OTHER_CHOICE_ID } from "./odyssey-interview.types";

const otherOption: OdysseyChoiceOption = {
  id: ODYSSEY_OTHER_CHOICE_ID,
  label: "직접 입력",
};

const Q2_CONTINUE = "q2_continue";
const Q2_CHANGE = "q2_change";
const Q2_UNSURE = "q2_unsure";

const Q6_YES = "q6_yes";
const Q6_NO = "q6_no";
const Q6_UNDECIDED = "q6_undecided";

const Q8_EXTEND = "q8_extend";
const Q8_SKIP = "q8_skip";

/**
 * 더미 플로우: 문구·선택지·분기만 데이터로 정의 (UI는 config 소비)
 */
export const ODYSSEY_INTERVIEW_QUESTIONS: OdysseyInterviewQuestionDef[] = [
  {
    id: "q1",
    type: "single_with_other",
    prompt: "지금 가장 많은 시간을 쓰고 있는 일은 무엇인가요?",
    reaction: "지금 삶의 중심축이 조금 보이기 시작했어요.",
    choices: [
      { id: "q1_study", label: "학업" },
      { id: "q1_job_prep", label: "취업 준비" },
      { id: "q1_work", label: "직장 업무" },
      { id: "q1_side", label: "사이드 프로젝트·부업" },
      { id: "q1_home", label: "육아·가사" },
      { id: "q1_rest", label: "휴식·회복" },
      otherOption,
    ],
    nextId: "q2",
  },
  {
    id: "q2",
    type: "single",
    prompt:
      "지금 하고 있는 전공이나 일은 앞으로도 계속 이어가고 싶은가요?",
    reaction: "유지할지 전환할지, 스스로의 감각이 정리되고 있어요.",
    choices: [
      { id: Q2_CONTINUE, label: "네, 이 방향으로 계속 가고 싶어요" },
      { id: Q2_CHANGE, label: "아니요, 방향을 바꾸고 싶어요" },
      { id: Q2_UNSURE, label: "잘 모르겠어요" },
    ],
    nextId: "q3",
  },
  {
    id: "q3",
    type: "single_with_other",
    prompt: "그 이유를 가장 가깝게 설명하는 것은 무엇인가요?",
    reaction: "이유가 보이면 다음 질문이 더 정확해져요.",
    resolveChoices: (answers) => {
      const q2 = answers.q2?.choiceIds[0];
      if (q2 === Q2_CONTINUE) {
        return [
          { id: "q3c_stability", label: "이미 쌓아온 게 있어서" },
          { id: "q3c_interest", label: "흥미가 있어서" },
          { id: "q3c_invest", label: "여기까지 투자한 게 아까워서" },
          { id: "q3c_career", label: "커리어상 자연스러워서" },
          otherOption,
        ];
      }
      if (q2 === Q2_CHANGE) {
        return [
          { id: "q3ch_burnout", label: "지치거나 맞지 않아서" },
          { id: "q3ch_fit", label: "나와 안 맞는다고 느껴져서" },
          { id: "q3ch_income", label: "조건·성장이 아쉬워서" },
          { id: "q3ch_passion", label: "다른 일이 더 끌려서" },
          otherOption,
        ];
      }
      return [
        { id: "q3u_interest", label: "끌리는 게 분명하지 않아서" },
        { id: "q3u_fear", label: "바꾸는 게 두려워서" },
        { id: "q3u_pressure", label: "주변 기대나 현실 때문이에요" },
        { id: "q3u_experience", label: "아직 경험이 부족해서" },
        otherOption,
      ];
    },
    nextId: "q4",
  },
  {
    id: "q4",
    type: "single_with_other",
    prompt: "지금 당장 가장 하고 싶은 일은 무엇에 가까운가요?",
    reaction: "당장 끌리는 쪽이 플랜에 큰 힌트가 돼요.",
    choices: [
      { id: "q4_learn", label: "새로 배우고 익히기" },
      { id: "q4_create", label: "무언가 만들기" },
      { id: "q4_rest", label: "쉬고 회복하기" },
      { id: "q4_social", label: "사람들과 함께하기" },
      { id: "q4_challenge", label: "도전 과제 잡기" },
      otherOption,
    ],
    nextId: "q5",
  },
  {
    id: "q5",
    type: "multi_with_other",
    prompt: "앞으로 가장 피하고 싶은 삶이나 일은 무엇인가요? (복수 선택 가능)",
    reaction: "피하고 싶은 것도 방향을 만드는 데 중요해요.",
    choices: [
      { id: "q5_overwork", label: "과로·번아웃" },
      { id: "q5_stuck", label: "정체된 일상" },
      { id: "q5_toxic", label: "불건전한 관계·환경" },
      { id: "q5_meaningless", label: "의미 없다고 느껴지는 일" },
      { id: "q5_finance", label: "경제적 불안만 커지는 삶" },
      otherOption,
    ],
    nextId: "q6",
  },
  {
    id: "q6",
    type: "single",
    prompt:
      "앞으로 자격증, 진학, 이직, 혹은 새로운 공부를 생각하고 있나요?",
    reaction: "미래 확장에 대한 의지가 조금씩 드러났어요.",
    choices: [
      { id: Q6_YES, label: "네, 생각 중이에요" },
      { id: Q6_NO, label: "당장은 없어요" },
      { id: Q6_UNDECIDED, label: "아직 구체적으로 정하지 못했어요" },
    ],
    resolveNextId: (_answers, payload) => {
      const v = payload.choiceIds[0];
      if (v === Q6_YES) return "q7";
      return "q8";
    },
  },
  {
    id: "q7",
    type: "text",
    prompt: "있다면 어떤 방향인지 간단히 적어주세요.",
    reaction: "구체 방향이 있으면 초안으로 옮기기 쉬워요.",
    nextId: "q8",
  },
  {
    id: "q8",
    type: "branching_confirm",
    prompt:
      "조금 더 구체화하고 싶다면, 확장 질문으로 이어갈 수 있어요. 어떻게 할까요?",
    reaction: "원하는 깊이만큼만 가도 괜찮아요.",
    choices: [
      { id: Q8_EXTEND, label: "네, 확장 질문으로 이어갈게요" },
      { id: Q8_SKIP, label: "아니요, 여기까지로 할게요" },
    ],
    resolveNextId: (_answers, payload) =>
      payload.choiceIds[0] === Q8_EXTEND ? "q9" : "q11",
  },
  {
    id: "q9",
    type: "single_with_other",
    prompt: "가보고 싶은 곳이 있다면 어디인가요?",
    reaction: "상상이 구체일수록 동기에 가까워져요.",
    choices: [
      { id: "q9_local", label: "국내 어딘가" },
      { id: "q9_abroad", label: "해외" },
      { id: "q9_org", label: "특정 회사·기관" },
      { id: "q9_school", label: "학교·교육 기관" },
      otherOption,
    ],
    nextId: "q10",
  },
  {
    id: "q10",
    type: "single_with_other",
    prompt: "그곳에 가고 싶은 이유는 무엇인가요?",
    reaction: "이유가 보이면 다음 행동이 조금 보이기 시작해요.",
    choices: [
      { id: "q10_grow", label: "성장하고 싶어서" },
      { id: "q10_rest", label: "쉬고 싶어서" },
      { id: "q10_proof", label: "나를 증명하고 싶어서" },
      { id: "q10_relation", label: "사람·관계 때문이에요" },
      otherOption,
    ],
    nextId: "q11",
  },
  {
    id: "q11",
    type: "single_with_other",
    prompt: "당신이 바라는 삶의 모습은 어떤 쪽에 가까운가요?",
    reaction: "바라는 삶의 형태가 있으면 플랜의 중심이 생겨요.",
    choices: [
      { id: "q11_calm", label: "여유 있고 안정적인 삶" },
      { id: "q11_challenge", label: "도전이 있는 삶" },
      { id: "q11_impact", label: "영향력 있는 삶" },
      { id: "q11_balance", label: "일과 삶의 균형" },
      { id: "q11_happy", label: "스스로 행복하다고 느끼는 삶" },
      otherOption,
    ],
    nextId: "q12",
  },
  {
    id: "q12",
    type: "complete",
    prompt:
      "지금까지의 답변을 바탕으로 오디세이 플랜 초안을 정리하겠습니다. 다음 단계에서 연차별 목표를 함께 다듬을 수 있어요.",
    reaction: "",
  },
];

const byId = new Map(
  ODYSSEY_INTERVIEW_QUESTIONS.map((q) => [q.id, q] as const),
);

export function getOdysseyQuestionById(
  id: string,
): OdysseyInterviewQuestionDef | undefined {
  return byId.get(id);
}

export function getOdysseyChoices(
  q: OdysseyInterviewQuestionDef,
  answers: OdysseyInterviewAnswers,
): OdysseyChoiceOption[] {
  if (q.resolveChoices) return q.resolveChoices(answers);
  return q.choices ?? [];
}
