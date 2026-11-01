import type { OdysseyInterviewAnswers } from "../interview/odyssey-interview.types";
import { getOdysseyQuestionById } from "../interview/odyssey-interview.flow";
import { findOdysseyFrontierQuestionId } from "../interview/odyssey-interview.logic";
import {
  validateOdysseyGenerateDraft,
  type OdysseyGenerateValidated,
} from "./odyssey-generate-response.validation";

export const ODYSSEY_INTERVIEW_STORAGE_KEY = "odyssey:interview:v1" as const;

export type OdysseyInterviewSession = {
  answers: OdysseyInterviewAnswers;
  currentQuestionId: string;
  /** A generated draft costs quota, so a refresh must not lose it. */
  draft: OdysseyGenerateValidated | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStoredAnswers(v: unknown): v is OdysseyInterviewAnswers {
  return (
    isRecord(v) &&
    Object.values(v).every(
      (answer) =>
        isRecord(answer) &&
        typeof answer.questionId === "string" &&
        Array.isArray(answer.choiceIds),
    )
  );
}

export function parseInterviewSession(raw: string): OdysseyInterviewSession | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 1) return null;
    const { answers, currentQuestionId, draft } = data;
    if (!isStoredAnswers(answers)) return null;
    if (typeof currentQuestionId !== "string") return null;
    const validatedDraft = draft == null ? null : validateOdysseyGenerateDraft(draft);
    return {
      answers,
      // A question from an older interview may be gone; resume where answers end.
      currentQuestionId: getOdysseyQuestionById(currentQuestionId)
        ? currentQuestionId
        : findOdysseyFrontierQuestionId(answers),
      draft: validatedDraft?.ok ? validatedDraft.value : null,
    };
  } catch {
    return null;
  }
}

export function readInterviewSession(): OdysseyInterviewSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ODYSSEY_INTERVIEW_STORAGE_KEY);
    return raw ? parseInterviewSession(raw) : null;
  } catch {
    return null;
  }
}

export function writeInterviewSession(session: OdysseyInterviewSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      ODYSSEY_INTERVIEW_STORAGE_KEY,
      JSON.stringify({ v: 1, ...session }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearInterviewSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ODYSSEY_INTERVIEW_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
