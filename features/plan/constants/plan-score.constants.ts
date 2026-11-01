export const PLAN_SCORE_KEYS = [
  "resources",
  "interest",
  "confidence",
  "coherence",
] as const;

export type PlanScoreKey = (typeof PLAN_SCORE_KEYS)[number];

/** Every label for the four self-rating scales, shared by web, mobile and PDF. */
export const PLAN_SCORE_LABELS: Record<
  PlanScoreKey,
  { en: string; ko: string; highMeaning: string }
> = {
  resources: {
    en: "RESOURCES",
    ko: "현실 여건과 자원",
    highMeaning: "시간·사람·여건이 충분하다고 느낄수록 높게",
  },
  interest: {
    en: "INTEREST",
    ko: "하고 싶은 마음",
    highMeaning: "해보고 싶은 마음이 강할수록 높게",
  },
  confidence: {
    en: "CONFIDENCE",
    ko: "해낼 수 있다는 감각",
    highMeaning: "해볼 만하다고 느낄수록 높게",
  },
  coherence: {
    en: "COHERENCE",
    ko: "나 다운 방향과의 일치감",
    highMeaning: "나다운 방향이라고 느낄수록 높게",
  },
};

export const PLAN_RATING_AVERAGE_LABEL = "자기평가 평균";
export const PLAN_RATING_OVERALL_LABEL = "전체 자기평가 평균";
export const PLAN_UNRATED_LABEL = "미평가";
export const PLAN_RATING_SCALE_NOTE =
  "1~5점 자기평가이며 높을수록 긍정적인 느낌입니다. 성공 가능성을 뜻하지 않습니다.";
export const PLAN_UNVERIFIED_SCORES_NOTE =
  "이전 버전에서 저장된 점수는 직접 입력했는지 AI가 만들었는지 확인할 수 없습니다.";
export const PLAN_NOT_COMPARABLE_LABEL = "평가가 더 필요해요";
export const PLAN_NO_DIFFERENCE_LABEL = "항목 간 차이 없음";
