"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  ODYSSEY_INTERVIEW_QUESTIONS,
  getOdysseyQuestionById,
} from "./odyssey-interview.flow";
import {
  formatUserAnswerLine,
  nextOdysseyChatMessageId,
  resolveOdysseyNextQuestionId,
  serializeOdysseyAnswersForApi,
  validateOdysseyPayload,
} from "./odyssey-interview.logic";
import {
  ODYSSEY_MS_REACTION_TO_QUESTION,
  ODYSSEY_MS_USER_TO_QUESTION,
  ODYSSEY_MS_USER_TO_REACTION,
} from "./odyssey-interview.timing";
import type {
  OdysseyAnswerPayload,
  OdysseyChatMessage,
  OdysseyInterviewAnswerValue,
  OdysseyInterviewAnswers,
} from "./odyssey-interview.types";

const firstQuestion = ODYSSEY_INTERVIEW_QUESTIONS[0]!;
const BOOTSTRAP_MS = 650;

function initialMessages(): OdysseyChatMessage[] {
  // Start with an empty transcript and bootstrap the first question after
  // a short delay so the UI can show the "..." waiting state.
  return [];
}

/** 채팅 transcript + 정규화된 answers (OpenAI 연동용 payload 분리) */
export function useOdysseyInterview() {
  const [messages, setMessages] = useState<OdysseyChatMessage[]>(initialMessages);
  const [currentQuestionId, setCurrentQuestionId] = useState(firstQuestion.id);
  const [answers, setAnswers] = useState<OdysseyInterviewAnswers>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [awaitingAiFollowUp, setAwaitingAiFollowUp] = useState(true);

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const followUpTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const submitLockRef = useRef(false);

  const clearFollowUpTimeouts = useCallback(() => {
    for (const id of followUpTimeoutsRef.current) {
      clearTimeout(id);
    }
    followUpTimeoutsRef.current = [];
  }, []);

  const scheduleFirstQuestion = useCallback(() => {
    setAwaitingAiFollowUp(true);
    const id = setTimeout(() => {
      setMessages([
        {
          id: nextOdysseyChatMessageId(),
          role: "ai",
          content: firstQuestion.prompt,
          variant: "question",
        },
      ]);
      setAwaitingAiFollowUp(false);
      submitLockRef.current = false;
    }, BOOTSTRAP_MS);
    followUpTimeoutsRef.current.push(id);
  }, []);

  useEffect(
    () => () => {
      clearFollowUpTimeouts();
    },
    [clearFollowUpTimeouts],
  );

  // Bootstrap the very first AI question with the same "..." waiting tone.
  useEffect(() => {
    scheduleFirstQuestion();
  }, [scheduleFirstQuestion]);

  const currentQuestion = getOdysseyQuestionById(currentQuestionId);
  const isCompleteScreen = currentQuestion?.type === "complete";

  const submitAnswer = useCallback((payload: OdysseyAnswerPayload) => {
    const q = getOdysseyQuestionById(currentQuestionId);
    if (!q || q.type === "complete" || awaitingAiFollowUp || submitLockRef.current) return;
    submitLockRef.current = true;

    const prevAnswers = answersRef.current;
    const validation = validateOdysseyPayload(q, payload);
    if (!validation.ok) {
      setValidationError(validation.message);
      return;
    }
    setValidationError(null);

    const value: OdysseyInterviewAnswerValue = {
      questionId: q.id,
      type: q.type,
      choiceIds: [...payload.choiceIds],
      text: payload.text?.trim() || undefined,
      answeredAt: new Date().toISOString(),
    };

    const nextAnswers: OdysseyInterviewAnswers = {
      ...prevAnswers,
      [q.id]: value,
    };

    const userLine = formatUserAnswerLine(q, payload, prevAnswers);
    const nextId = resolveOdysseyNextQuestionId(q, nextAnswers, payload);

    if (!nextId) {
      console.error("Odyssey interview: missing next question for", q.id);
      submitLockRef.current = false;
      return;
    }

    const nextQ = getOdysseyQuestionById(nextId);
    if (!nextQ) {
      console.error("Odyssey interview: unknown id", nextId);
      submitLockRef.current = false;
      return;
    }

    const userMessage: OdysseyChatMessage = {
      id: nextOdysseyChatMessageId(),
      role: "user",
      content: userLine,
    };

    clearFollowUpTimeouts();
    answersRef.current = nextAnswers;
    setAnswers(nextAnswers);
    setMessages((prev) => [...prev, userMessage]);
    setAwaitingAiFollowUp(true);

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      followUpTimeoutsRef.current.push(id);
    };

    const pushQuestionAndAdvance = () => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextOdysseyChatMessageId(),
          role: "ai",
          content: nextQ.prompt,
          variant: "question",
        },
      ]);
      setCurrentQuestionId(nextId);
      setAwaitingAiFollowUp(false);
      submitLockRef.current = false;
    };

    if (q.reaction.trim()) {
      schedule(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: nextOdysseyChatMessageId(),
            role: "ai",
            content: q.reaction,
            variant: "reaction",
          },
        ]);
        schedule(pushQuestionAndAdvance, ODYSSEY_MS_REACTION_TO_QUESTION);
      }, ODYSSEY_MS_USER_TO_REACTION);
    } else {
      schedule(pushQuestionAndAdvance, ODYSSEY_MS_USER_TO_QUESTION);
    }
  }, [awaitingAiFollowUp, clearFollowUpTimeouts, currentQuestionId]);

  const reset = useCallback(() => {
    clearFollowUpTimeouts();
    submitLockRef.current = false;
    answersRef.current = {};
    setAnswers({});
    setMessages(initialMessages());
    setCurrentQuestionId(firstQuestion.id);
    setValidationError(null);
    scheduleFirstQuestion();
  }, [clearFollowUpTimeouts, scheduleFirstQuestion]);

  const clearValidationError = useCallback(() => setValidationError(null), []);

  return {
    messages,
    answers,
    answersPayload: serializeOdysseyAnswersForApi(answers),
    currentQuestion,
    currentQuestionId,
    isCompleteScreen,
    awaitingAiFollowUp,
    submitAnswer,
    reset,
    validationError,
    clearValidationError,
  };
}
