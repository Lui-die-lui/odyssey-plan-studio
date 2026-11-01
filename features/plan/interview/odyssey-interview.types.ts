/**
 * Question/input kinds.
 * - `branching_confirm`: 이진(또는 소수) 분기용 단일 선택, 인터뷰형 넓은 버튼 레이아웃
 * - `complete`: 마무리 안내만 (추가 답변 없음)
 */
export type OdysseyQuestionType =
  | "single"
  | "multi"
  | "text"
  | "single_with_other"
  | "multi_with_other"
  | "branching_confirm"
  | "complete";

export type OdysseyChoiceOption = {
  id: string;
  label: string;
};

/** Payload from the composer when the user confirms */
export type OdysseyAnswerPayload = {
  choiceIds: string[];
  text?: string;
};

/** OpenAI 등으로 넘기기 좋은 정규화 답변 (질문 config와 분리) */
export type OdysseyInterviewAnswerValue = {
  questionId: string;
  type: OdysseyQuestionType;
  choiceIds: string[];
  text?: string;
  answeredAt: string;
};

export type OdysseyInterviewAnswers = Record<string, OdysseyInterviewAnswerValue>;

export type OdysseyInterviewQuestionDef = {
  id: string;
  type: OdysseyQuestionType;
  /** 질문 문구 */
  prompt: string;
  /** 답변 직후 함께 보여줄 짧은 문구 */
  reaction: string;
  choices?: OdysseyChoiceOption[];
  resolveChoices?: (answers: OdysseyInterviewAnswers) => OdysseyChoiceOption[];
  nextId?: string;
  resolveNextId?: (
    answers: OdysseyInterviewAnswers,
    payload: OdysseyAnswerPayload,
  ) => string | null;
};

export const ODYSSEY_OTHER_CHOICE_ID = "__other__" as const;
