import type { OdysseyAiPlanFormDraft } from "./odyssey-ai-plan-draft.types";

/**
 * OpenAI structured output + summary 화면 공통 타입 (DB/스토리지와 분리)
 */
export type OdysseyDraftSummarySection = {
  title: string;
  description: string;
};

export type OdysseyDraftSummary = {
  headline: string;
  summary: string;
  sections: OdysseyDraftSummarySection[];
  avoidNotes: string[];
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
