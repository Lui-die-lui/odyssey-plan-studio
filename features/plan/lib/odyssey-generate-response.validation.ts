import {
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
} from "../constants/plan.constants";
import {
  PLAN_PATH_KINDS,
  PLAN_PATH_LIMITS,
  type PlanPathKind,
} from "../constants/plan-path.constants";
import {
  PLAN_PREPARATION_MAX_PER_PATH,
  PLAN_PREPARATION_MAX_SHARED,
} from "../constants/plan-preparation.constants";
import type { PlanPreparation } from "../types/plan.types";
import {
  validatePreparation,
  type OdysseyPreparationContext,
} from "./odyssey-preparation.validation";
import type {
  OdysseyAiPathDraft,
  OdysseyAiPathExperiment,
  OdysseyAiPlanFormDraft,
  OdysseyAiPlanYearDraft,
  OdysseyAiSinglePlanDraft,
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
const MAX_AI_EXPERIMENTS = 3;
const BRIEF_MAX = 60;

/** Older drafts have no briefs, so a missing one is fine but a long one is not. */
const isBrief = (v: unknown): v is string | undefined =>
  v === undefined || (typeof v === "string" && v.trim().length <= BRIEF_MAX);

/** 두 경로의 목표·행동이 이 비율 이상 겹치면 표현만 바꾼 같은 계획으로 봅니다. */
const MAX_PATH_SIMILARITY = 0.7;

/** 이 표현이 짧은 문장의 전부라면 실행 내용이 없는 것으로 봅니다. */
const VAGUE_PHRASES = [
  /역량(을)? ?강화/,
  /기반(을)? ?마련/,
  /균형(을)? ?유지/,
  /준비(를)? ?심화/,
  /방향(을)? ?유지/,
];
const VAGUE_TEXT_MAX_CHARS = 30;

/** 첫 실험은 되돌릴 수 있어야 합니다. "퇴사한 사람과 대화"는 걸리지 않습니다. */
const BIG_DECISION = /퇴사(를|하|합)|사표|자퇴|휴학(을|하|합)|대출(을|받)|고액/;

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
  const { headline, summary, missingInfo, keywords, differenceNote } = data;
  if (!isText(headline, PLAN_MAX_LENGTH.aiGuidanceText)) return fail("summary_headline");
  if (!isText(summary, PLAN_MAX_LENGTH.note)) return fail("summary_text");
  if (typeof differenceNote !== "string") return fail("summary_difference_note");

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
      differenceNote,
    },
  };
}

function validateYear(
  item: unknown,
  isKnownId: IsKnownQuestionId,
  prefix: string,
): Validated<OdysseyAiPlanYearDraft> {
  if (!isRecord(item)) return fail(`${prefix}year_shape`);
  const { yearIndex, goal, actions, checkpoint, evidence, pivotCondition, keywords } = item;

  if (!PLAN_ODYSSEY_YEAR_INDICES.some((idx) => idx === yearIndex)) {
    return fail(`${prefix}year_index`);
  }
  const year = yearIndex as number;
  const code = (name: string) => `${prefix}year${year}_${name}`;

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
  if (!isBrief(item.briefGoal) || !isBrief(item.briefAction)) return fail(code("brief"));

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
      briefGoal: (item.briefGoal as string | undefined) ?? "",
      briefAction: (item.briefAction as string | undefined) ?? "",
    },
  };
}

function validateYears(
  years: unknown,
  isKnownId: IsKnownQuestionId,
  prefix = "",
): Validated<OdysseyAiPlanYearDraft[]> {
  if (!Array.isArray(years) || years.length !== PLAN_ODYSSEY_YEAR_INDICES.length) {
    return fail(`${prefix}plan_year_count`);
  }

  const parsed: OdysseyAiPlanYearDraft[] = [];
  const seenYears = new Set<number>();
  const seenActions = new Set<string>();

  for (const item of years) {
    const year = validateYear(item, isKnownId, prefix);
    if (!year.ok) return year;
    if (seenYears.has(year.value.yearIndex)) return fail(`${prefix}plan_year_duplicate`);
    seenYears.add(year.value.yearIndex);

    for (const action of year.value.actions) {
      const key = action.replace(/\s+/g, "");
      if (seenActions.has(key)) return fail(`${prefix}plan_action_repeated`);
      seenActions.add(key);
    }
    parsed.push(year.value);
  }

  parsed.sort((a, b) => a.yearIndex - b.yearIndex);
  return { ok: true, value: parsed };
}

function validateExperiments(
  raw: unknown,
  prefix: string,
): Validated<OdysseyAiPathExperiment[]> {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > MAX_AI_EXPERIMENTS) {
    return fail(`${prefix}experiment_count`);
  }
  const experiments: OdysseyAiPathExperiment[] = [];
  for (const item of raw) {
    if (
      !isRecord(item) ||
      !isText(item.action, PLAN_PATH_LIMITS.listItemLength) ||
      !isText(item.learning, PLAN_PATH_LIMITS.listItemLength)
    ) {
      return fail(`${prefix}experiment_text`);
    }
    experiments.push({ action: item.action, learning: item.learning });
  }
  if (BIG_DECISION.test(experiments[0]!.action)) return fail(`${prefix}experiment_big_decision`);
  return { ok: true, value: experiments };
}

function validatePreparations(
  raw: unknown,
  options: {
    prefix: string;
    isKnownId: IsKnownQuestionId;
    context?: OdysseyPreparationContext;
    planText: string;
    pathKind?: PlanPathKind;
  },
): Validated<PlanPreparation[]> {
  if (!Array.isArray(raw)) return fail(`${options.prefix}preparation_shape`);
  const items: PlanPreparation[] = [];
  for (const item of raw) {
    const result = validatePreparation(item, options);
    if (!result.ok) return result;
    items.push(result.value);
  }
  return { ok: true, value: items };
}

function validatePath(
  raw: unknown,
  isKnownId: IsKnownQuestionId,
  context?: OdysseyPreparationContext,
): Validated<OdysseyAiPathDraft> {
  if (!isRecord(raw)) return fail("path_shape");
  const { kind, title, overview, appeal } = raw;
  // No longer generated; drafts saved earlier may still carry them.
  const requirements = raw.requirements ?? [];
  const openQuestions = raw.openQuestions ?? [];
  if (!PLAN_PATH_KINDS.includes(kind as PlanPathKind)) return fail("path_kind");
  const prefix = `${kind as string}_`;

  if (!isText(title, PLAN_PATH_LIMITS.title)) return fail(`${prefix}title`);
  if (!isText(overview, PLAN_PATH_LIMITS.text)) return fail(`${prefix}overview`);
  if (!isBrief(raw.tagline) || !isBrief(raw.credentialNote)) return fail(`${prefix}brief`);
  if (
    !isRecord(appeal) ||
    !isText(appeal.text, PLAN_PATH_LIMITS.text) ||
    !hasValidEvidenceIds(appeal.questionIds, 1, isKnownId)
  ) {
    return fail(`${prefix}appeal`);
  }
  if (!isTextList(requirements, 5, PLAN_PATH_LIMITS.listItemLength)) {
    return fail(`${prefix}requirements`);
  }
  if (!isTextList(openQuestions, 4, PLAN_PATH_LIMITS.listItemLength)) {
    return fail(`${prefix}open_questions`);
  }

  const experiments = validateExperiments(raw.experiments, prefix);
  if (!experiments.ok) return experiments;
  const years = validateYears(raw.years, isKnownId, prefix);
  if (!years.ok) return years;

  const preparations = validatePreparations(raw.preparations ?? [], {
    prefix,
    isKnownId,
    context,
    pathKind: kind as PlanPathKind,
    planText: [title, overview, ...years.value.flatMap((y) => [y.goal, ...y.actions])].join(" "),
  });
  if (!preparations.ok) return preparations;

  return {
    ok: true,
    value: {
      kind: kind as PlanPathKind,
      tagline: (raw.tagline as string | undefined) ?? "",
      credentialNote: (raw.credentialNote as string | undefined) ?? "",
      preparations: preparations.value,
      title,
      overview,
      appeal: { text: appeal.text, questionIds: appeal.questionIds },
      requirements,
      openQuestions,
      experiments: experiments.value,
      years: years.value,
    },
  };
}

const textOf = (path: OdysseyAiPathDraft) =>
  path.years
    .flatMap((y) => [y.goal, ...y.actions])
    .join(" ")
    .replace(/\s+/g, "");

function bigrams(text: string): Set<string> {
  const grams = new Set<string>();
  for (let i = 0; i < text.length - 1; i++) grams.add(text.slice(i, i + 2));
  return grams;
}

/** 0(완전히 다름)~1(같음). 문장 순서나 어미만 바꾼 경로도 높게 나옵니다. */
export function measurePathSimilarity(a: OdysseyAiPathDraft, b: OdysseyAiPathDraft): number {
  const gramsA = bigrams(textOf(a));
  const gramsB = bigrams(textOf(b));
  if (!gramsA.size || !gramsB.size) return 0;
  const shared = [...gramsA].filter((gram) => gramsB.has(gram)).length;
  return shared / (gramsA.size + gramsB.size - shared);
}

export function validateOdysseyAiPlanForm(
  data: unknown,
  isKnownId: IsKnownQuestionId,
  context?: OdysseyPreparationContext,
): Validated<OdysseyAiPlanFormDraft> {
  if (!isRecord(data)) return fail("plan_shape");
  const { title, paths } = data;
  if (!isText(title, PLAN_MAX_LENGTH.title)) return fail("plan_title");
  if (!Array.isArray(paths) || paths.length !== PLAN_PATH_KINDS.length) {
    return fail("plan_path_count");
  }

  const parsed: OdysseyAiPathDraft[] = [];
  for (const raw of paths) {
    const path = validatePath(raw, isKnownId, context);
    if (!path.ok) return path;
    if (parsed.some((p) => p.kind === path.value.kind)) return fail("plan_path_duplicate");
    parsed.push(path.value);
  }

  for (let i = 0; i < parsed.length; i++) {
    for (let j = i + 1; j < parsed.length; j++) {
      if (measurePathSimilarity(parsed[i]!, parsed[j]!) >= MAX_PATH_SIMILARITY) {
        return fail("paths_too_similar");
      }
    }
  }

  const rawShared = data.sharedPreparations ?? [];
  if (!Array.isArray(rawShared) || rawShared.length > PLAN_PREPARATION_MAX_SHARED) {
    return fail("shared_preparation_count");
  }
  const sharedPreparations = validatePreparations(rawShared, {
    prefix: "shared_",
    isKnownId,
    context,
    planText: parsed.map(textOf).join(" "),
  });
  if (!sharedPreparations.ok) return sharedPreparations;

  for (const path of parsed) {
    if (path.preparations.length + rawShared.length > PLAN_PREPARATION_MAX_PER_PATH) {
      return fail(`${path.kind}_preparation_count`);
    }
  }

  parsed.sort((a, b) => PLAN_PATH_KINDS.indexOf(a.kind) - PLAN_PATH_KINDS.indexOf(b.kind));
  return {
    ok: true,
    value: { title, paths: parsed, sharedPreparations: sharedPreparations.value },
  };
}

/** 이전 버전(sessionStorage v2)의 단일 경로 초안을 읽습니다. */
export function validateOdysseySinglePlanDraft(data: unknown): Validated<OdysseyAiSinglePlanDraft> {
  if (!isRecord(data) || !isText(data.title, PLAN_MAX_LENGTH.title)) return fail("plan_shape");
  const years = validateYears(data.years, () => true);
  return years.ok ? { ok: true, value: { title: data.title, years: years.value } } : years;
}

/** 생성 때 근거 ID를 검증한 초안을 다시 읽을 때 구조만 확인합니다. */
export function validateOdysseyGenerateDraft(
  parsed: unknown,
): Validated<OdysseyGenerateValidated> {
  if (!isRecord(parsed)) return fail("root_shape");
  const summary = validateSummary(parsed.summary, () => true);
  if (!summary.ok) return summary;
  const planForm = validateOdysseyAiPlanForm(parsed.planForm, () => true);
  if (!planForm.ok) return planForm;
  return { ok: true, value: { summary: summary.value, planForm: planForm.value } };
}

/** 근거 ID는 이번 요청에서 실제로 제출된 유효 답변만 가리켜야 합니다. */
export function validateOdysseyGenerateResponse(
  parsed: unknown,
  answeredQuestionIds: ReadonlySet<string>,
  context?: OdysseyPreparationContext,
): Validated<OdysseyGenerateValidated> {
  if (!isRecord(parsed)) return fail("root_shape");
  const isKnownId = (id: string) => answeredQuestionIds.has(id);

  const summary = validateSummary(parsed.summary, isKnownId);
  if (!summary.ok) return summary;
  const planForm = validateOdysseyAiPlanForm(parsed.planForm, isKnownId, context);
  if (!planForm.ok) return planForm;

  return { ok: true, value: { summary: summary.value, planForm: planForm.value } };
}
