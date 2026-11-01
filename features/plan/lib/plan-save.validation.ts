import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
  PLAN_SCORE_MAX,
  PLAN_SCORE_MIN,
} from "@/features/plan/constants/plan.constants";
import {
  PLAN_SCORE_KEYS,
  type PlanScoreKey,
} from "@/features/plan/constants/plan-score.constants";
import type {
  PlanDistanceScore,
  PlanYearAiGuidance,
  PlanYearScores,
  SavePlanRequestPayload,
} from "@/features/plan/types/plan.types";

export type ParseSavePlanResult =
  | { ok: true; data: SavePlanRequestPayload }
  | { ok: false; message: string };

const invalid = (message: string): ParseSavePlanResult => ({ ok: false, message });

const normalizeOptionalString = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length ? trimmed : undefined;
};

const QUESTION_ID_PATTERN = /^q[a-z0-9_]*$/;
const MAX_EVIDENCE_QUESTION_IDS = 6;

type ParsedScore = PlanDistanceScore | null | "invalid";

/** `null` stays unrated; it is never turned into a default rating. */
const parseScore = (n: unknown): ParsedScore => {
  if (n === null || n === undefined) return null;
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return "invalid";
  return Math.min(PLAN_SCORE_MAX, Math.max(PLAN_SCORE_MIN, v)) as PlanDistanceScore;
};

const parseScores = (raw: unknown): PlanYearScores | null => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const resources = parseScore(o.resources);
  const interest = parseScore(o.interest);
  const confidence = parseScore(o.confidence);
  const coherence = parseScore(o.coherence);
  if (
    resources === "invalid" ||
    interest === "invalid" ||
    confidence === "invalid" ||
    coherence === "invalid"
  ) {
    return null;
  }
  return { resources, interest, confidence, coherence };
};

const parseUnverifiedScoreKeys = (
  raw: unknown,
  scores: PlanYearScores,
): PlanScoreKey[] | null => {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return null;
  const known = PLAN_SCORE_KEYS.filter((key) => raw.includes(key));
  if (known.length !== raw.length) return null;
  return known.filter((key) => scores[key] !== null);
};

const isGuidanceText = (v: unknown): v is string =>
  typeof v === "string" &&
  v.trim().length > 0 &&
  v.length <= PLAN_MAX_LENGTH.aiGuidanceText;

const parseAiGuidance = (raw: unknown): PlanYearAiGuidance | null => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const { sourceGoalTexts, checkpoint, rationale, evidenceQuestionIds, pivotCondition } = o;

  if (
    !Array.isArray(sourceGoalTexts) ||
    sourceGoalTexts.length < 1 ||
    sourceGoalTexts.length > PLAN_MAX_GOALS_PER_YEAR ||
    !sourceGoalTexts.every(
      (t) => typeof t === "string" && t.trim().length > 0 && t.length <= PLAN_MAX_LENGTH.goal,
    )
  ) {
    return null;
  }
  if (
    !Array.isArray(evidenceQuestionIds) ||
    evidenceQuestionIds.length < 1 ||
    evidenceQuestionIds.length > MAX_EVIDENCE_QUESTION_IDS ||
    !evidenceQuestionIds.every((id) => typeof id === "string" && QUESTION_ID_PATTERN.test(id))
  ) {
    return null;
  }
  if (
    !isGuidanceText(checkpoint) ||
    !isGuidanceText(rationale) ||
    !isGuidanceText(pivotCondition)
  ) {
    return null;
  }
  return { sourceGoalTexts, checkpoint, rationale, evidenceQuestionIds, pivotCondition };
};

const parseBoundedStringList = (
  raw: unknown,
  max: number,
  maxLen: number,
  label: string,
):
  | { ok: true; values: string[] }
  | { ok: false; message: string } => {
  if (!Array.isArray(raw)) {
    return { ok: true, values: [] };
  }
  if (raw.length > max) {
    return { ok: false, message: `At most ${max} ${label} allowed.` };
  }
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") {
      return { ok: false, message: `Invalid ${label} entry.` };
    }
    const t = item.trim();
    if (!t) continue;
    if (t.length > maxLen) {
      return { ok: false, message: `${label} text too long.` };
    }
    out.push(t);
  }
  return { ok: true, values: out };
};

export function parseSavePlanBody(body: unknown): ParseSavePlanResult {
  if (!body || typeof body !== "object") return invalid("Invalid JSON body.");

  const o = body as Record<string, unknown>;
  const title =
    o.title === undefined || o.title === null
      ? undefined
      : typeof o.title === "string"
        ? normalizeOptionalString(o.title)
        : null;
  if (title === null) return invalid("Invalid title.");
  if (title && title.length > PLAN_MAX_LENGTH.title) return invalid("Title too long.");

  if (!Array.isArray(o.years)) return invalid("years must be an array.");

  const byIndex = new Map<number, (typeof o.years)[number]>();
  for (const row of o.years) {
    if (!row || typeof row !== "object") return invalid("Invalid year entry.");
    const yr = row as Record<string, unknown>;
    const yearIndex = Number(yr.yearIndex);
    if (
      !Number.isInteger(yearIndex) ||
      !(PLAN_ODYSSEY_YEAR_INDICES as readonly number[]).includes(yearIndex)
    ) {
      return invalid("yearIndex must be 1–5.");
    }
    if (byIndex.has(yearIndex)) return invalid("Duplicate yearIndex.");
    byIndex.set(yearIndex, row);
  }

  const years: SavePlanRequestPayload["years"] = [];

  for (const idx of PLAN_ODYSSEY_YEAR_INDICES) {
    const row = byIndex.get(idx);
    if (!row) return invalid(`Missing year ${idx}.`);
    const yr = row as Record<string, unknown>;

    const noteRaw = yr.note;
    const note =
      noteRaw === undefined || noteRaw === null
        ? undefined
        : typeof noteRaw === "string"
          ? normalizeOptionalString(noteRaw)
          : null;
    if (note === null) return invalid(`Invalid note for year ${idx}.`);
    if (note && note.length > PLAN_MAX_LENGTH.note) {
      return invalid(`Note too long for year ${idx}.`);
    }

    const scores = parseScores(yr.scores);
    if (!scores) return invalid(`Invalid scores for year ${idx}.`);

    const unverifiedScoreKeys = parseUnverifiedScoreKeys(yr.unverifiedScoreKeys, scores);
    if (!unverifiedScoreKeys) return invalid(`Invalid score source for year ${idx}.`);

    const aiGuidance =
      yr.aiGuidance === undefined || yr.aiGuidance === null
        ? undefined
        : parseAiGuidance(yr.aiGuidance);
    if (aiGuidance === null) return invalid(`Invalid AI guidance for year ${idx}.`);

    const goalsParsed = parseBoundedStringList(
      yr.goals,
      PLAN_MAX_GOALS_PER_YEAR,
      PLAN_MAX_LENGTH.goal,
      "goals",
    );
    if (!goalsParsed.ok) return invalid(`${goalsParsed.message} (year ${idx})`);

    const keywordsParsed = parseBoundedStringList(
      yr.keywords,
      PLAN_MAX_KEYWORDS_PER_YEAR,
      PLAN_MAX_LENGTH.keyword,
      "keywords",
    );
    if (!keywordsParsed.ok) return invalid(`${keywordsParsed.message} (year ${idx})`);

    years.push({
      yearIndex: idx,
      note,
      scores,
      unverifiedScoreKeys,
      goals: goalsParsed.values,
      keywords: keywordsParsed.values,
      aiGuidance,
    });
  }

  const totalGoals = years.reduce((n, y) => n + y.goals.length, 0);
  if (totalGoals === 0) return invalid("At least one goal is required.");

  return { ok: true, data: { title, years } };
}
