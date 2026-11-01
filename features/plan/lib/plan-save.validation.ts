import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
  PLAN_SCORE_MAX,
  PLAN_SCORE_MIN,
} from "@/features/plan/constants/plan.constants";
import {
  PLAN_PATH_KINDS,
  PLAN_PATH_LIMITS,
  PLAN_PATH_MARKS,
  type PlanPathKind,
} from "@/features/plan/constants/plan-path.constants";
import {
  PLAN_PREPARATION_KINDS,
  PLAN_PREPARATION_MAX_PER_PATH,
  PLAN_PREPARATION_MAX_SHARED,
  PLAN_PREPARATION_PRIORITIES,
  findPreparationCatalogEntry,
  type PlanPreparationKind,
  type PlanPreparationPriority,
} from "@/features/plan/constants/plan-preparation.constants";
import {
  PLAN_SCORE_KEYS,
  type PlanScoreKey,
} from "@/features/plan/constants/plan-score.constants";
import type {
  PlanDistanceScore,
  PlanPathExperiment,
  PlanPathSavePayload,
  PlanPreparation,
  PlanYearAiGuidance,
  PlanYearSavePayload,
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
  const briefGoal = o.briefGoal ?? "";
  const briefAction = o.briefAction ?? "";
  if (!isBoundedText(briefGoal, PLAN_PATH_LIMITS.listItemLength)) return null;
  if (!isBoundedText(briefAction, PLAN_PATH_LIMITS.listItemLength)) return null;
  return {
    sourceGoalTexts,
    checkpoint,
    rationale,
    evidenceQuestionIds,
    pivotCondition,
    briefGoal,
    briefAction,
  };
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

type ParsedList<T> = { ok: true; values: T } | { ok: false; message: string };

function parseYearList(rawYears: unknown[]): ParsedList<PlanYearSavePayload[]> {
  const invalid = (message: string): ParsedList<PlanYearSavePayload[]> => ({ ok: false, message });
  const o = { years: rawYears };

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

  return { ok: true, values: years };
}

const isBoundedText = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length <= max;

const isTextList = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.length <= PLAN_PATH_LIMITS.listItems &&
  v.every(
    (item) =>
      typeof item === "string" &&
      item.trim().length > 0 &&
      item.length <= PLAN_PATH_LIMITS.listItemLength,
  );

const parseExperiments = (raw: unknown): PlanPathExperiment[] | null => {
  if (!Array.isArray(raw) || raw.length > PLAN_PATH_LIMITS.experiments) return null;
  const experiments: PlanPathExperiment[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const { action, learning, nextUp } = item as Record<string, unknown>;
    if (
      !isBoundedText(action, PLAN_PATH_LIMITS.listItemLength) ||
      !action.trim() ||
      !isBoundedText(learning, PLAN_PATH_LIMITS.listItemLength) ||
      !learning.trim()
    ) {
      return null;
    }
    experiments.push({ action, learning, nextUp: nextUp === true });
  }
  return experiments;
};

const parsePreparations = (raw: unknown, max: number): PlanPreparation[] | null => {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > max) return null;
  const items: PlanPreparation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const p = item as Record<string, unknown>;
    const text = PLAN_PATH_LIMITS.listItemLength * 2;
    const catalogId = p.catalogId ?? null;
    if (catalogId !== null && !findPreparationCatalogEntry(catalogId as string)) return null;
    if (
      !PLAN_PREPARATION_KINDS.includes(p.kind as PlanPreparationKind) ||
      !PLAN_PREPARATION_PRIORITIES.includes(p.priority as PlanPreparationPriority) ||
      !isBoundedText(p.title, PLAN_PATH_LIMITS.title) ||
      !isBoundedText(p.reason, text) ||
      !isBoundedText(p.brief ?? "", text) ||
      !isBoundedText(p.basis, text) ||
      !isBoundedText(p.checkpoint, text) ||
      !isBoundedText(p.conditions, text) ||
      !isBoundedText(p.alternative, text) ||
      !Array.isArray(p.evidenceQuestionIds) ||
      !p.evidenceQuestionIds.every((id) => typeof id === "string" && QUESTION_ID_PATTERN.test(id))
    ) {
      return null;
    }
    items.push({
      catalogId: catalogId as string | null,
      title: p.title,
      kind: p.kind as PlanPreparationKind,
      priority: p.priority as PlanPreparationPriority,
      reason: p.reason,
      brief: (p.brief as string | undefined) ?? "",
      basis: p.basis,
      evidenceQuestionIds: p.evidenceQuestionIds as string[],
      checkpoint: p.checkpoint,
      conditions: p.conditions,
      alternative: p.alternative,
    });
  }
  return items;
};

function parsePath(raw: unknown): ParsedList<PlanPathSavePayload> {
  const invalid = (message: string): ParsedList<PlanPathSavePayload> => ({ ok: false, message });
  if (!raw || typeof raw !== "object") return invalid("Invalid path.");
  const p = raw as Record<string, unknown>;

  if (!PLAN_PATH_KINDS.includes(p.kind as PlanPathKind)) return invalid("Invalid path kind.");
  const kind = p.kind as PlanPathKind;

  if (
    !isBoundedText(p.title, PLAN_PATH_LIMITS.title) ||
    !p.title.trim() ||
    !isBoundedText(p.overview, PLAN_PATH_LIMITS.text) ||
    !isBoundedText(p.tagline ?? "", PLAN_PATH_LIMITS.text) ||
    !isBoundedText(p.credentialNote ?? "", PLAN_PATH_LIMITS.text) ||
    !isBoundedText(p.appeal, PLAN_PATH_LIMITS.text)
  ) {
    return invalid(`Invalid text for path ${kind}.`);
  }

  const ids = p.appealQuestionIds;
  if (
    !Array.isArray(ids) ||
    ids.length > PLAN_PATH_LIMITS.evidenceIds ||
    !ids.every((id) => typeof id === "string" && QUESTION_ID_PATTERN.test(id))
  ) {
    return invalid(`Invalid evidence for path ${kind}.`);
  }
  if (!isTextList(p.requirements) || !isTextList(p.openQuestions)) {
    return invalid(`Invalid lists for path ${kind}.`);
  }

  const experiments = parseExperiments(p.experiments);
  if (!experiments) return invalid(`Invalid experiments for path ${kind}.`);

  const scores = parseScores(p.scores);
  if (!scores) return invalid(`Invalid scores for path ${kind}.`);

  if (
    !Array.isArray(p.marks) ||
    !p.marks.every((m) => PLAN_PATH_MARKS.includes(m as (typeof PLAN_PATH_MARKS)[number]))
  ) {
    return invalid(`Invalid marks for path ${kind}.`);
  }

  const preparations = parsePreparations(p.preparations, PLAN_PREPARATION_MAX_PER_PATH);
  if (!preparations) return invalid(`Invalid preparations for path ${kind}.`);

  if (!Array.isArray(p.years)) return invalid(`Invalid years for path ${kind}.`);
  const years = parseYearList(p.years);
  if (!years.ok) return invalid(`${years.message} (path ${kind})`);

  return {
    ok: true,
    values: {
      kind,
      title: p.title,
      overview: p.overview,
      tagline: (p.tagline as string | undefined) ?? "",
      credentialNote: (p.credentialNote as string | undefined) ?? "",
      appeal: p.appeal,
      appealQuestionIds: ids as string[],
      requirements: p.requirements,
      openQuestions: p.openQuestions,
      experiments,
      preparations,
      scores,
      marks: p.marks as PlanPathSavePayload["marks"],
      years: years.values,
    },
  };
}

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

  if (o.years === undefined && o.paths === undefined) {
    return invalid("years must be an array.");
  }

  let years: PlanYearSavePayload[] | undefined;
  if (o.years !== undefined) {
    if (!Array.isArray(o.years)) return invalid("years must be an array.");
    const parsedYears = parseYearList(o.years);
    if (!parsedYears.ok) return invalid(parsedYears.message);
    years = parsedYears.values;
  }

  let paths: PlanPathSavePayload[] | undefined;
  if (o.paths !== undefined) {
    if (!Array.isArray(o.paths) || o.paths.length !== PLAN_PATH_KINDS.length) {
      return invalid("paths must include all three paths.");
    }
    paths = [];
    for (const raw of o.paths) {
      const parsedPath = parsePath(raw);
      if (!parsedPath.ok) return invalid(parsedPath.message);
      paths.push(parsedPath.values);
    }
    if (new Set(paths.map((p) => p.kind)).size !== PLAN_PATH_KINDS.length) {
      return invalid("Duplicate path kind.");
    }
  }

  const sharedPreparations = parsePreparations(o.sharedPreparations, PLAN_PREPARATION_MAX_SHARED);
  if (!sharedPreparations) return invalid("Invalid shared preparations.");

  const allYears = [...(years ?? []), ...(paths ?? []).flatMap((p) => p.years)];
  if (allYears.every((y) => y.goals.length === 0)) {
    return invalid("At least one goal is required.");
  }

  return { ok: true, data: { title, years, paths, sharedPreparations } };
}
