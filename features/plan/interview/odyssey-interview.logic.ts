import {
  ODYSSEY_INTERVIEW_QUESTIONS,
  getOdysseyChoices,
  getOdysseyQuestionById,
} from "./odyssey-interview.flow";
import type {
  OdysseyAnswerPayload,
  OdysseyInterviewAnswerValue,
  OdysseyInterviewAnswers,
  OdysseyInterviewQuestionDef,
} from "./odyssey-interview.types";
import { ODYSSEY_OTHER_CHOICE_ID } from "./odyssey-interview.types";

let idSeq = 0;
export function nextOdysseyChatMessageId(): string {
  idSeq += 1;
  return `m_${Date.now()}_${idSeq}`;
}

export function buildChoiceLabelMap(
  q: OdysseyInterviewQuestionDef,
  answers: OdysseyInterviewAnswers,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of getOdysseyChoices(q, answers)) {
    map.set(c.id, c.label);
  }
  return map;
}

export function formatUserAnswerLine(
  q: OdysseyInterviewQuestionDef,
  payload: OdysseyAnswerPayload,
  answers: OdysseyInterviewAnswers,
): string {
  const lookup = buildChoiceLabelMap(q, answers);
  const trimmed = payload.text?.trim();

  if (q.type === "text") {
    return trimmed ?? "";
  }

  const ids = payload.choiceIds.filter((id) => id !== ODYSSEY_OTHER_CHOICE_ID);
  const labels = ids.map((id) => lookup.get(id) ?? id);
  const hasOther = payload.choiceIds.includes(ODYSSEY_OTHER_CHOICE_ID);

  if (hasOther && trimmed) {
    labels.push(trimmed);
  } else if (hasOther && !trimmed) {
    labels.push("직접 입력");
  }

  return labels.join(", ") || "(선택 없음)";
}

export type ValidateResult = { ok: true } | { ok: false; message: string };

export function validateOdysseyPayload(
  q: OdysseyInterviewQuestionDef,
  payload: OdysseyAnswerPayload,
): ValidateResult {
  const trimmed = payload.text?.trim() ?? "";
  const hasOther = payload.choiceIds.includes(ODYSSEY_OTHER_CHOICE_ID);

  if (q.type === "text") {
    if (!trimmed) return { ok: false, message: "내용을 입력해 주세요." };
    return { ok: true };
  }

  if (
    q.type === "single" ||
    q.type === "single_with_other" ||
    q.type === "branching_confirm"
  ) {
    if (payload.choiceIds.length !== 1) {
      return { ok: false, message: "하나를 선택해 주세요." };
    }
    if (hasOther && !trimmed) {
      return { ok: false, message: "직접 입력 내용을 적어 주세요." };
    }
    return { ok: true };
  }

  if (q.type === "multi" || q.type === "multi_with_other") {
    if (payload.choiceIds.length < 1) {
      return { ok: false, message: "하나 이상 선택해 주세요." };
    }
    if (hasOther && !trimmed) {
      return { ok: false, message: "직접 입력 내용을 적어 주세요." };
    }
    return { ok: true };
  }

  if (q.type === "complete") {
    return { ok: false, message: "" };
  }

  return { ok: false, message: "선택해 주세요." };
}

export function serializeOdysseyAnswersForApi(
  answers: OdysseyInterviewAnswers,
): { version: 1; answers: OdysseyInterviewAnswers } {
  return { version: 1, answers };
}

export function resolveOdysseyNextQuestionId(
  q: OdysseyInterviewQuestionDef,
  nextAnswers: OdysseyInterviewAnswers,
  payload: OdysseyAnswerPayload,
): string | null {
  if (q.resolveNextId) return q.resolveNextId(nextAnswers, payload);
  if (q.nextId) return q.nextId;
  return null;
}

function isAnswerValidForQuestion(
  q: OdysseyInterviewQuestionDef,
  answer: OdysseyInterviewAnswerValue,
  activeAnswers: OdysseyInterviewAnswers,
): boolean {
  if (!validateOdysseyPayload(q, answer).ok) return false;
  const choiceIds = new Set(getOdysseyChoices(q, activeAnswers).map((c) => c.id));
  return answer.choiceIds.every((id) => choiceIds.has(id));
}

/**
 * 현재 답변으로 실제 지나온 질문의 답변만 반환합니다.
 * 분기가 바뀌어 남은 예전 답변이나, 현재 선택지에 없는 답변은 제외합니다.
 */
export function collectActiveOdysseyAnswers(
  answers: OdysseyInterviewAnswers,
): OdysseyInterviewAnswers {
  const active: OdysseyInterviewAnswers = {};
  const visited = new Set<string>();
  let questionId: string | null | undefined = ODYSSEY_INTERVIEW_QUESTIONS[0]?.id;

  while (questionId && !visited.has(questionId)) {
    visited.add(questionId);
    const q = getOdysseyQuestionById(questionId);
    if (!q || q.type === "complete") break;

    const answer = answers[q.id];
    if (answer && isAnswerValidForQuestion(q, answer, active)) {
      active[q.id] = answer;
      questionId = resolveOdysseyNextQuestionId(q, active, answer);
    } else {
      questionId = q.nextId;
    }
  }

  return active;
}
