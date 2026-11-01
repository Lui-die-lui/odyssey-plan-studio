import type { OdysseyAiPlanFormDraft } from "./odyssey-ai-plan-draft.types";

/**
 * OpenAI structured output + summary 화면 공통 타입 (DB/스토리지와 분리)
 */
export type OdysseyDraftEvidencedText = {
  text: string;
  questionIds: string[];
};

export type OdysseyDraftSummary = {
  headline: string;
  summary: string;
  /** 사용자가 실제로 선택하거나 입력한 내용 */
  facts: OdysseyDraftEvidencedText[];
  /** 여러 답변을 연결한 제한적 판단 */
  interpretations: OdysseyDraftEvidencedText[];
  /** 계획을 구체화하려면 먼저 확인할 정보 */
  missingInfo: string[];
  avoidNotes: OdysseyDraftEvidencedText[];
  keywords: string[];
};

export type OdysseyGenerateRequestBody = {
  answers: Record<
    string,
    {
      questionId: string;
      type: string;
      choiceIds: string[];
      text?: string;
      answeredAt: string;
    }
  >;
};

export type OdysseyGenerateSuccessBody = {
  summary: OdysseyDraftSummary;
  planForm: OdysseyAiPlanFormDraft;
};

export type OdysseyGenerateErrorBody = {
  error: string;
};
