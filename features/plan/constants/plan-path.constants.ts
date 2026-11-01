export const PLAN_PATH_KINDS = ["continue", "alternative", "unbound"] as const;
export type PlanPathKind = (typeof PLAN_PATH_KINDS)[number];

/** The three paths are equals: different questions, never a ranking. */
export const PLAN_PATHS: Record<
  PlanPathKind,
  { letter: string; name: string; question: string; color: string }
> = {
  continue: {
    letter: "A",
    name: "지금 이어가는 삶",
    question: "현재 방향을 계속 발전시킨다면 어떤 5년을 살게 될까요?",
    color: "#5f83c9",
  },
  alternative: {
    letter: "B",
    name: "다른 길의 삶",
    question: "지금의 주요 활동을 더 이상 선택할 수 없다면 어떤 대안을 만들까요?",
    color: "#3f9c8a",
  },
  unbound: {
    letter: "C",
    name: "제약을 잠시 내려놓은 삶",
    question: "돈이나 타인의 평가가 선택을 제한하지 않는다면 무엇을 시도해 볼까요?",
    color: "#d3923f",
  },
};

export const PLAN_PATH_MARKS = ["attracted", "ready", "curious"] as const;
export type PlanPathMark = (typeof PLAN_PATH_MARKS)[number];

export const PLAN_PATH_MARK_LABELS: Record<PlanPathMark, string> = {
  attracted: "가장 끌려요",
  ready: "지금 자원이 준비됐어요",
  curious: "더 알아보고 싶어요",
};

/** Wording for rating a whole path, which differs from rating one year. */
export const PLAN_PATH_SCORE_MEANINGS = {
  resources: "실행에 필요한 시간·돈·기술·도움이 얼마나 준비됐나요?",
  interest: "이 삶을 얼마나 경험해 보고 싶나요?",
  confidence: "실행할 수 있다고 얼마나 느끼나요?",
  coherence: "내 가치관과 바라는 삶에 얼마나 맞나요?",
} as const;

export const PLAN_PATH_LIMITS = {
  title: 80,
  text: 1000,
  listItems: 6,
  listItemLength: 300,
  experiments: 5,
  evidenceIds: 6,
} as const;

export const PLAN_LEGACY_LABEL = "기존 단일 계획";
