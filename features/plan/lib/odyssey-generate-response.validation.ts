import {
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
} from "../constants/plan.constants";
import type {
  OdysseyAiPlanFormDraft,
  OdysseyAiPlanYearDraft,
} from "../interview/odyssey-ai-plan-draft.types";
import type {
  OdysseyDraftEvidencedText,
  OdysseyDraftSummary,
} from "../interview/odyssey-draft-summary.types";

/**
 * 모델 응답의 런타임 검증. 값을 고치지 않고, 규칙을 어기면 실패 사유 코드를 돌려줍니다.
 * 사유 코드에는 사용자 답변이나 모델 문장이 들어가지 않으므로 로그에 남겨도 됩니다.
 */
export type OdysseyValidationFailure = { ok: false; reason: string };
type Validated<T> = { ok: true; value: T } | OdysseyValidationFailure;

export type OdysseyGenerateValidated = {
  summary: OdysseyDraftSummary;
  planForm: OdysseyAiPlanFormDraft;
};

type IsKnownQuestionId = (id: string) => boolean;

const MAX_EVIDENCE_IDS = 6;
const MAX_AI_ACTIONS_PER_YEAR = 2;

/** 이 표현이 짧은 문장의 전부라면 실행 내용이 없는 것으로 봅니다. */
const VAGUE_PHRASES = [
  /역량(을)? ?강화/,
  /기반(을)? ?마련/,
  /균형(을)? ?유지/,
  /준비(를)? ?심화/,
  /방향(을)? ?유지/,
];
const VAGUE_TEXT_MAX_CHARS = 30;

const fail = (reason: string): OdysseyValidationFailure => ({ ok: false, reason });

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isText(v: unknown, maxLength: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.trim().length <= maxLength;
}

function isTextList(v: unknown, maxItems: number, maxLength: number): v is string[] {
  return (
    Array.isArray(v) &&
    v.length <= maxItems &&
    v.every((item) => isText(item, maxLength))
  );
}

function isVague(text: string): boolean {
  return (
    text.trim().length <= VAGUE_TEXT_MAX_CHARS &&
    VAGUE_PHRASES.some((phrase) => phrase.test(text))
  );
}

function hasValidEvidenceIds(
  ids: unknown,
  minItems: number,
  isKnownId: IsKnownQuestionId,
): ids is string[] {
  return (
    Array.isArray(ids) &&
    ids.length >= minItems &&
    ids.length <= MAX_EVIDENCE_IDS &&
    new Set(ids).size === ids.length &&
    ids.every((id) => typeof id === "string" && isKnownId(id))
  );
}

function validateEvidencedTexts(
  raw: unknown,
  label: string,
  limits: { min: number; max: number; minIds: number },
  isKnownId: IsKnownQuestionId,
): Validated<OdysseyDraftEvidencedText[]> {
  if (!Array.isArray(raw) || raw.length < limits.min || raw.length > limits.max) {
    return fail(`${label}_count`);
  }
  const items: OdysseyDraftEvidencedText[] = [];
  for (const item of raw) {
    if (!isRecord(item) || !isText(item.text, PLAN_MAX_LENGTH.aiGuidanceText)) {
      return fail(`${label}_text`);
    }
    if (!hasValidEvidenceIds(item.questionIds, limits.minIds, isKnownId)) {
      return fail(`${label}_evidence`);
    }
    items.push({ text: item.text, questionIds: item.questionIds });
  }
  return { ok: true, value: items };
}

function validateSummary(
  data: unknown,
  isKnownId: IsKnownQuestionId,
): Validated<OdysseyDraftSummary> {
  if (!isRecord(data)) return fail("summary_shape");
  const { headline, summary, missingInfo, keywords } = data;
  if (!isText(headline, PLAN_MAX_LENGTH.aiGuidanceText)) return fail("summary_headline");
  if (!isText(summary, PLAN_MAX_LENGTH.note)) return fail("summary_text");

  const facts = validateEvidencedTexts(data.facts, "facts", { min: 1, max: 6, minIds: 1 }, isKnownId);
  if (!facts.ok) return facts;
  const interpretations = validateEvidencedTexts(
    data.interpretations,
    "interpretations",
    { min: 0, max: 3, minIds: 2 },
    isKnownId,
  );
  if (!interpretations.ok) return interpretations;
  const avoidNotes = validateEvidencedTexts(
    data.avoidNotes,
    "avoid_notes",
    { min: 0, max: 5, minIds: 1 },
    isKnownId,
  );
  if (!avoidNotes.ok) return avoidNotes;

  if (!isTextList(missingInfo, 4, PLAN_MAX_LENGTH.aiGuidanceText)) return fail("missing_info");
  if (!isTextList(keywords, 5, PLAN_MAX_LENGTH.title)) return fail("summary_keywords");

  return {
    ok: true,
    value: {
      headline,
      summary,
      facts: facts.value,
      interpretations: interpretations.value,
      missingInfo,
      avoidNotes: avoidNotes.value,
      keywords,
    },
  };
}

function validateYear(
  item: unknown,
  isKnownId: IsKnownQuestionId,
): Validated<OdysseyAiPlanYearDraft> {
  if (!isRecord(item)) return fail("year_shape");
  const { yearIndex, goal, actions, checkpoint, evidence, pivotCondition, keywords } = item;

  if (!PLAN_ODYSSEY_YEAR_INDICES.some((idx) => idx === yearIndex)) return fail("year_index");
  const year = yearIndex as number;
  const code = (name: string) => `year${year}_${name}`;

  if (!isText(goal, PLAN_MAX_LENGTH.goal)) return fail(code("goal"));
  if (
    !isTextList(actions, MAX_AI_ACTIONS_PER_YEAR, PLAN_MAX_LENGTH.goal) ||
    actions.length < 1
  ) {
    return fail(code("actions"));
  }
  if (!isText(checkpoint, PLAN_MAX_LENGTH.aiGuidanceText)) return fail(code("checkpoint"));
  if (!isText(pivotCondition, PLAN_MAX_LENGTH.aiGuidanceText)) return fail(code("pivot"));
  if (!isRecord(evidence) || !isText(evidence.explanation, PLAN_MAX_LENGTH.aiGuidanceText)) {
    return fail(code("evidence_text"));
  }
  if (!hasValidEvidenceIds(evidence.questionIds, 1, isKnownId)) {
    return fail(code("evidence_ids"));
  }
  if (!isTextList(keywords, PLAN_MAX_KEYWORDS_PER_YEAR, PLAN_MAX_LENGTH.keyword)) {
    return fail(code("keywords"));
  }
  if ([...actions, checkpoint].some(isVague)) return fail(code("vague"));

  return {
    ok: true,
    value: {
      yearIndex: year,
      goal,
      actions,
      checkpoint,
      evidence: { questionIds: evidence.questionIds, explanation: evidence.explanation },
      pivotCondition,
      keywords,
    },
  };
}

export function validateOdysseyAiPlanForm(
  data: unknown,
  isKnownId: IsKnownQuestionId,
): Validated<OdysseyAiPlanFormDraft> {
  if (!isRecord(data)) return fail("plan_shape");
  const { title, years } = data;
  if (!isText(title, PLAN_MAX_LENGTH.title)) return fail("plan_title");
  if (!Array.isArray(years) || years.length !== PLAN_ODYSSEY_YEAR_INDICES.length) {
    return fail("plan_year_count");
  }

  const parsed: OdysseyAiPlanYearDraft[] = [];
  const seenYears = new Set<number>();
  const seenActions = new Set<string>();

  for (const item of years) {
    const year = validateYear(item, isKnownId);
    if (!year.ok) return year;
    if (seenYears.has(year.value.yearIndex)) return fail("plan_year_duplicate");
    seenYears.add(year.value.yearIndex);

    for (const action of year.value.actions) {
      const key = action.replace(/\s+/g, "");
      if (seenActions.has(key)) return fail("plan_action_repeated");
      seenActions.add(key);
    }
    parsed.push(year.value);
  }

  parsed.sort((a, b) => a.yearIndex - b.yearIndex);
  return { ok: true, value: { title, years: parsed } };
}

/** 근거 ID는 이번 요청에서 실제로 제출된 유효 답변만 가리켜야 합니다. */
export function validateOdysseyGenerateResponse(
  parsed: unknown,
  answeredQuestionIds: ReadonlySet<string>,
): Validated<OdysseyGenerateValidated> {
  if (!isRecord(parsed)) return fail("root_shape");
  const isKnownId = (id: string) => answeredQuestionIds.has(id);

  const summary = validateSummary(parsed.summary, isKnownId);
  if (!summary.ok) return summary;
  const planForm = validateOdysseyAiPlanForm(parsed.planForm, isKnownId);
  if (!planForm.ok) return planForm;

  return { ok: true, value: { summary: summary.value, planForm: planForm.value } };
}
