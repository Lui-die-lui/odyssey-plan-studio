/**
 * OpenAI가 반환하는 5년 플랜 초안 (create 폼 매핑 전).
 * 점수는 사용자가 직접 평가하므로 여기에 포함하지 않습니다.
 */
export type OdysseyAiPlanEvidence = {
  questionIds: string[];
  explanation: string;
};

export type OdysseyAiPlanYearDraft = {
  yearIndex: number;
  /** 그 시점에 달라져 있을 상태 */
  goal: string;
  /** 실행 가능한 핵심 행동 1~2개 */
  actions: string[];
  /** 진행 여부를 확인할 산출물·경험·피드백 */
  checkpoint: string;
  evidence: OdysseyAiPlanEvidence;
  /** 어떤 결과면 이후 계획을 바꿀지 */
  pivotCondition: string;
  keywords: string[];
};

export type OdysseyAiPlanFormDraft = {
  title: string;
  years: OdysseyAiPlanYearDraft[];
};

/** sessionStorage v1 시절 초안. 점수는 AI가 만든 값이라 읽어 오지 않습니다. */
export type OdysseyLegacyAiPlanYearDraft = {
  yearIndex: number;
  plans: string[];
  keywords: string[];
  note?: string;
};

export type OdysseyLegacyAiPlanFormDraft = {
  title: string;
  years: OdysseyLegacyAiPlanYearDraft[];
};
