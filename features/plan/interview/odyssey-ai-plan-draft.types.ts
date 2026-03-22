/**
 * OpenAI가 반환하는 5년 플랜 초안 (create 폼 매핑 전)
 * - `plans`는 연도별 목표 문장 배열 → 폼의 goals로 변환
 */
export type OdysseyAiCategoryScores = {
  resources: number;
  interest: number;
  confidence: number;
  coherence: number;
};

export type OdysseyAiPlanYearDraft = {
  yearIndex: number;
  plans: string[];
  categoryScores: OdysseyAiCategoryScores;
  keywords: string[];
  /** 연도 메모(선택). 폼의 year note에 대응 */
  note?: string;
};

export type OdysseyAiPlanFormDraft = {
  title: string;
  years: OdysseyAiPlanYearDraft[];
};
