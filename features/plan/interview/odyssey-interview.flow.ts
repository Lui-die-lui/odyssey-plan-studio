import type {
  OdysseyChoiceOption,
  OdysseyInterviewAnswers,
  OdysseyInterviewQuestionDef,
} from "./odyssey-interview.types";
import { ODYSSEY_OTHER_CHOICE_ID } from "./odyssey-interview.types";

const otherOption: OdysseyChoiceOption = {
  id: ODYSSEY_OTHER_CHOICE_ID,
  label: "직접 입력하기",
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
 * 문구·선택지·분기를 데이터로 정의합니다 (UI는 config 소비).
 * 공통 질문은 한 번만 묻고, q_path_a~c는 세 경로에 필요한 차이만 묻습니다.
 * 모두 "잘 모르겠어요"로 넘어갈 수 있고, 예산 같은 세부 정보는 묻지 않습니다.
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
      "지금 가장 많은 시간을 쓰는 그 활동을 앞으로도 이어가고 싶은가요?",
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
    reaction: "",
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
    reaction: "",
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
    reaction: "",
    choices: [
      { id: Q6_YES, label: "네, 생각 중이에요" },
      { id: Q6_NO, label: "당장은 없어요" },
      { id: Q6_UNDECIDED, label: "아직 구체적으로 정하지 못했어요" },
    ],
    resolveNextId: (_answers, payload) => {
      const v = payload.choiceIds[0];
      if (v === Q6_YES) return "q7";
      return "q_assets";
    },
  },
  {
    id: "q7",
    type: "text",
    prompt: "있다면 어떤 방향인지 간단히 적어주세요.",
    reaction: "",
    nextId: "q_assets",
  },
  {
    id: "q_assets",
    type: "multi_with_other",
    prompt:
      "해본 일이나 활용할 수 있는 경험·자원이 있나요? (복수 선택 가능, 보유한 자격은 직접 입력에 적어 주세요)",
    reaction: "",
    choices: [
      { id: "q_assets_work", label: "관련된 일이나 공부를 해봤어요" },
      { id: "q_assets_output", label: "직접 만들어 본 결과물이 있어요" },
      { id: "q_assets_people", label: "물어볼 사람이나 모임이 있어요" },
      { id: "q_assets_none", label: "아직 없거나 잘 모르겠어요" },
      otherOption,
    ],
    nextId: "q_time",
  },
  {
    id: "q_time",
    type: "single_with_other",
    prompt: "이 계획과 공부에 일주일에 현실적으로 얼마나 쓸 수 있나요?",
    reaction: "",
    choices: [
      { id: "q_time_low", label: "2시간 이하" },
      { id: "q_time_mid", label: "3~5시간" },
      { id: "q_time_high", label: "6~10시간" },
      { id: "q_time_full", label: "10시간 넘게" },
      { id: "q_time_unknown", label: "아직 모르겠어요" },
      otherOption,
    ],
    nextId: "q_limits",
  },
  {
    id: "q_limits",
    type: "multi_with_other",
    prompt: "계획을 세울 때 꼭 지켜야 할 조건이 있나요? (복수 선택 가능)",
    reaction: "덕분에 무리 없는 속도로 맞춰 볼 수 있어요.",
    choices: [
      { id: "q_limits_health", label: "건강·회복 시간" },
      { id: "q_limits_care", label: "가족·돌봄" },
      { id: "q_limits_schedule", label: "지금 일이나 학업 일정" },
      { id: "q_limits_income", label: "수입 유지" },
      { id: "q_limits_abroad", label: "한국 밖에서 지낼 계획이에요" },
      { id: "q_limits_none", label: "특별히 없거나 말하고 싶지 않아요" },
      otherOption,
    ],
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
    reaction: "상상이 구체적일수록 동기에 가까워져요.",
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
    reaction: "",
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
    prompt: "삶에서 가장 중요하게 여기는 것은 어떤 쪽에 가까운가요?",
    reaction: "이제 세 가지 삶을 하나씩 떠올려 볼게요.",
    choices: [
      { id: "q11_calm", label: "여유 있고 안정적인 삶" },
      { id: "q11_challenge", label: "도전이 있는 삶" },
      { id: "q11_impact", label: "영향력 있는 삶" },
      { id: "q11_balance", label: "일과 삶의 균형" },
      { id: "q11_happy", label: "스스로 행복하다고 느끼는 삶" },
      otherOption,
    ],
    nextId: "q_path_a",
  },
  {
    id: "q_path_a",
    type: "single_with_other",
    prompt: "지금의 방향을 앞으로 5년 이어간다면, 무엇을 유지하거나 키우고 싶나요?",
    reaction: "",
    choices: [
      { id: "q_path_a_deepen", label: "지금 하는 것을 더 깊게 하고 싶어요" },
      { id: "q_path_a_widen", label: "지금 하는 것의 범위를 넓히고 싶어요" },
      { id: "q_path_a_sustain", label: "무리 없이 오래 지속하고 싶어요" },
      { id: "q_path_a_unknown", label: "잘 모르겠어요" },
      otherOption,
    ],
    nextId: "q_path_b",
  },
  {
    id: "q_path_b",
    type: "single_with_other",
    prompt: "지금의 주요 활동을 더 이상 선택할 수 없다면, 어떤 대안에 관심이 가나요?",
    reaction: "",
    choices: [
      { id: "q_path_b_transfer", label: "지금까지의 경험을 다른 분야에 써 보기" },
      { id: "q_path_b_postponed", label: "미뤄 둔 관심사를 시작하기" },
      { id: "q_path_b_people", label: "사람들과 함께하는 다른 활동 찾기" },
      { id: "q_path_b_unknown", label: "잘 모르겠어요" },
      otherOption,
    ],
    nextId: "q_path_c",
  },
  {
    id: "q_path_c",
    type: "single_with_other",
    prompt: "돈이나 타인의 평가를 잠시 내려놓고 상상한다면, 어떤 삶을 해보고 싶나요?",
    reaction: "",
    choices: [
      { id: "q_path_c_create", label: "만들고 표현하는 삶" },
      { id: "q_path_c_explore", label: "배우고 탐구하는 삶" },
      { id: "q_path_c_care", label: "누군가를 돕고 돌보는 삶" },
      { id: "q_path_c_place", label: "다른 곳에서 살아 보는 삶" },
      { id: "q_path_c_unknown", label: "잘 모르겠어요" },
      otherOption,
    ],
    nextId: "q12",
  },
  {
    id: "q12",
    type: "complete",
    prompt:
      "지금까지의 답변을 바탕으로 세 가지 경로의 초안을 만들 수 있어요. 다음 단계에서 비교하고 다듬을 수 있습니다.",
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
