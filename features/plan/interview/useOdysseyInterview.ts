"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clearInterviewSession,
  readInterviewSession,
  writeInterviewSession,
} from "../lib/odyssey-interview-session";
import type { OdysseyGenerateValidated } from "../lib/odyssey-generate-response.validation";
import {
  ODYSSEY_INTERVIEW_QUESTIONS,
  getOdysseyQuestionById,
} from "./odyssey-interview.flow";
import {
  collectActiveOdysseyAnswers,
  findOdysseyFrontierQuestionId,
  formatUserAnswerLine,
  validateOdysseyPayload,
} from "./odyssey-interview.logic";
import type {
  OdysseyAnswerPayload,
  OdysseyInterviewAnswers,
} from "./odyssey-interview.types";

const firstQuestion = ODYSSEY_INTERVIEW_QUESTIONS[0]!;

export type OdysseyAnsweredEntry = {
  questionId: string;
  question: string;
  answerLine: string;
  reaction: string;
};

/**
 * 인터뷰 상태. 지나온 답변은 저장된 메시지가 아니라 현재 answers에서 계산하므로,
 * 답변을 고치면 화면과 서버로 보내는 내용이 항상 함께 바뀝니다.
 * 이 훅은 인증 뒤 클라이언트에서만 마운트되어 sessionStorage를 초기값으로 읽습니다.
 */
export function useOdysseyInterview() {
  const [session] = useState(readInterviewSession);
  const [answers, setAnswers] = useState<OdysseyInterviewAnswers>(session?.answers ?? {});
  const [currentQuestionId, setCurrentQuestionId] = useState(
    session?.currentQuestionId ?? firstQuestion.id,
  );
  const [draft, setDraft] = useState<OdysseyGenerateValidated | null>(session?.draft ?? null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    writeInterviewSession({ answers, currentQuestionId, draft });
  }, [answers, currentQuestionId, draft]);

  const entries = useMemo<OdysseyAnsweredEntry[]>(() => {
    const active = collectActiveOdysseyAnswers(answers);
    return Object.values(active).flatMap((answer) => {
      const q = getOdysseyQuestionById(answer.questionId);
      if (!q) return [];
      return [
        {
          questionId: q.id,
          question: q.prompt,
          answerLine: formatUserAnswerLine(q, answer, active),
          reaction: q.reaction,
        },
      ];
    });
  }, [answers]);

  const frontierQuestionId = useMemo(() => findOdysseyFrontierQuestionId(answers), [answers]);
  const isEditing = currentQuestionId !== frontierQuestionId;

  const submitAnswer = useCallback(
    (payload: OdysseyAnswerPayload) => {
      const q = getOdysseyQuestionById(currentQuestionId);
      if (!q || q.type === "complete") return;

      const validation = validateOdysseyPayload(q, payload);
      if (!validation.ok) {
        setValidationError(validation.message);
        return;
      }
      setValidationError(null);

      const nextAnswers: OdysseyInterviewAnswers = {
        ...answers,
        [q.id]: {
          questionId: q.id,
          type: q.type,
          choiceIds: [...payload.choiceIds],
          text: payload.text?.trim() || undefined,
          answeredAt: new Date().toISOString(),
        },
      };
      setAnswers(nextAnswers);
      setCurrentQuestionId(findOdysseyFrontierQuestionId(nextAnswers));
    },
    [answers, currentQuestionId],
  );

  const editAnswer = useCallback((questionId: string) => {
    setValidationError(null);
    setCurrentQuestionId(questionId);
  }, []);

  const cancelEdit = useCallback(() => {
    setValidationError(null);
    setCurrentQuestionId(frontierQuestionId);
  }, [frontierQuestionId]);

  const reset = useCallback(() => {
    clearInterviewSession();
    setAnswers({});
    setDraft(null);
    setCurrentQuestionId(firstQuestion.id);
    setValidationError(null);
  }, []);

  const clearValidationError = useCallback(() => setValidationError(null), []);

  return {
    answers,
    entries,
    currentQuestion: getOdysseyQuestionById(currentQuestionId),
    isEditing,
    draft,
    setDraft,
    submitAnswer,
    editAnswer,
    cancelEdit,
    reset,
    validationError,
    clearValidationError,
  };
}
