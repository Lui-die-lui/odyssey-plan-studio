import { PLAN_ODYSSEY_YEAR_INDICES } from "../constants/plan.constants";
import { PLAN_LEGACY_LABEL, PLAN_PATHS } from "../constants/plan-path.constants";
import {
  PLAN_PREPARATION_UNVERIFIED_LABEL,
  findPreparationCatalogEntry,
} from "../constants/plan-preparation.constants";
import { PLAN_SCORE_KEYS, type PlanScoreKey } from "../constants/plan-score.constants";
import type {
  PlanPathDto,
  PlanPreparation,
  PlanYearDto,
  PlanYearScores,
  SavedPlanResponse,
} from "../types/plan.types";
import { getYearGoalLines } from "./plan-ai-guidance";

/**
 * Display-only summary for the one-page PDF. It reads saved plans and never
 * writes back, so what the user wrote stays whole on the web.
 */
const PLAN_TITLE_CHARS = 46;
const PATH_TITLE_CHARS = 40;
const STUDY_TITLE_CHARS = 20;
const GOAL_CHARS = 42;
const SINGLE_COLUMN_CHARS = 120;
const TAGLINE_CHARS = 56;
const PURPOSE_CHARS = 26;
const NOTE_CHARS = 44;
const STEP_CHARS = 56;
const STUDIES_SHOWN = 2;

/** Fits all four ratings on one supporting line. */
const SHORT_SCORE_LABELS: Record<PlanScoreKey, string> = {
  resources: "여건",
  interest: "마음",
  confidence: "자신감",
  coherence: "일치감",
};

export const NO_CREDENTIAL_FALLBACK = "희망 직무가 정해지면 필요한 자격을 확인해 보세요";

export type OneSheetYear = { goal: string; action: string };

export type OneSheetColumn = {
  key: string;
  letter: string;
  name: string;
  color: string;
  title: string;
  tagline: string;
  years: OneSheetYear[];
  studies: { title: string; purpose: string }[];
  credential: { name: string; reason: string; status: string } | null;
  credentialNote: string;
  firstStep: string;
  rating: string;
};

export type OneSheet = {
  title: string;
  columns: OneSheetColumn[];
  hasLegacyPlan: boolean;
};

/**
 * Shortens at a sentence, then a clause, then a word boundary, so the result
 * still reads as a phrase. Only the last resort adds an ellipsis.
 */
export function condenseText(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const sentence = clean.match(/^.+?[.!?。](?=\s|$)/)?.[0];
  if (sentence && sentence.length <= max) return sentence.replace(/[.。]$/, "");

  const clauses = clean.split(/(?<=[,，;:·])\s+|\s+[-–]\s+/);
  let clause = "";
  for (const part of clauses) {
    const next = clause ? `${clause} ${part}` : part;
    if (next.length > max) break;
    clause = next;
  }
  if (clause) return clause.replace(/[,，;:·]$/, "");

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function summarizeYear(year: PlanYearDto | undefined, chars: number): OneSheetYear {
  if (!year || !year.goals.length) return { goal: "", action: "" };

  const lines = getYearGoalLines(year.aiGuidance, year.goals);
  const { aiGuidance: guidance } = year;
  // Briefs describe the generated text, so they apply only while it is unedited.
  const unedited = lines[0]?.role === "goal";
  const firstText = lines[0]?.text ?? "";
  const secondText = lines[1]?.text ?? "";

  return {
    goal: condenseText((unedited && guidance?.briefGoal) || firstText, chars),
    action: condenseText((unedited && guidance?.briefAction) || secondText, chars),
  };
}

const summarizeYears = (years: PlanYearDto[], chars = GOAL_CHARS) =>
  PLAN_ODYSSEY_YEAR_INDICES.map((index) =>
    summarizeYear(years.find((y) => y.yearIndex === index), chars),
  );

function summarizeRating(scores: PlanYearScores): string {
  const rated = PLAN_SCORE_KEYS.filter((key) => scores[key] !== null);
  if (!rated.length) return "자기평가 전";
  return "자기평가 " + rated.map((key) => `${SHORT_SCORE_LABELS[key]} ${scores[key]}`).join(" · ");
}

function summarizeStudies(items: PlanPreparation[]) {
  return items
    .filter((item) => item.kind !== "credential")
    .slice(0, STUDIES_SHOWN)
    .map((item) => ({
      title: condenseText(item.title, STUDY_TITLE_CHARS),
      purpose: condenseText(item.brief || item.reason, PURPOSE_CHARS),
    }));
}

function summarizeCredential(items: PlanPreparation[]): OneSheetColumn["credential"] {
  const item = items.find((p) => p.kind === "credential");
  if (!item) return null;
  const entry = findPreparationCatalogEntry(item.catalogId);
  return {
    name: entry?.name ?? item.title,
    reason: condenseText(item.brief || item.reason, PURPOSE_CHARS),
    status: entry?.requirementLabel ?? PLAN_PREPARATION_UNVERIFIED_LABEL,
  };
}

function pathColumn(path: PlanPathDto, shared: PlanPreparation[]): OneSheetColumn {
  const { letter, name, color } = PLAN_PATHS[path.kind];
  const preparations = [...path.preparations, ...shared];
  const first = path.experiments.find((e) => e.nextUp) ?? path.experiments[0];

  return {
    key: path.kind,
    letter,
    name,
    color,
    title: condenseText(path.title, PATH_TITLE_CHARS),
    tagline: condenseText(path.tagline || path.overview, TAGLINE_CHARS),
    years: summarizeYears(path.years),
    studies: summarizeStudies(preparations),
    credential: summarizeCredential(preparations),
    credentialNote: path.credentialNote
      ? condenseText(path.credentialNote, NOTE_CHARS)
      : NO_CREDENTIAL_FALLBACK,
    firstStep: first ? condenseText(first.action, STEP_CHARS) : "",
    rating: summarizeRating(path.scores),
  };
}

function legacyColumn(plan: SavedPlanResponse): OneSheetColumn {
  return {
    key: "legacy",
    letter: "",
    name: PLAN_LEGACY_LABEL,
    color: "#6b6a63",
    title: condenseText(plan.title ?? "나의 5년 계획", PATH_TITLE_CHARS),
    tagline: "",
    years: summarizeYears(plan.years, SINGLE_COLUMN_CHARS),
    studies: [],
    credential: null,
    credentialNote: "",
    firstStep: "",
    rating: "",
  };
}

export function buildOneSheet(plan: SavedPlanResponse): OneSheet {
  const hasPaths = plan.paths.length > 0;
  return {
    title: condenseText(plan.title ?? (hasPaths ? "나의 세 가지 5년" : "나의 5년 계획"), PLAN_TITLE_CHARS),
    columns: hasPaths
      ? plan.paths.map((path) => pathColumn(path, plan.sharedPreparations))
      : [legacyColumn(plan)],
    hasLegacyPlan: hasPaths && plan.years.some((y) => y.goals.length > 0),
  };
}
