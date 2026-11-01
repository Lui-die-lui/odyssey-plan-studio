import {
  PLAN_SCORE_KEYS,
  type PlanScoreKey,
} from "../constants/plan-score.constants";
import {
  PLAN_PATH_KINDS,
  PLAN_PATH_MARKS,
  type PlanPathKind,
} from "../constants/plan-path.constants";
import type {
  PlanPathDto,
  PlanPathSavePayload,
  PlanYearAiGuidance,
  PlanYearDto,
  PlanYearSavePayload,
  PlanYearScores,
  SavedPlanResponse,
} from "../types/plan.types";
import { prisma } from "@/lib/prisma";

const yearInclude = {
  goals: { orderBy: { position: "asc" as const } },
  keywords: { orderBy: { position: "asc" as const } },
  aiGuidance: true,
} as const;

export const planInclude = {
  years: {
    where: { pathId: null },
    orderBy: { yearIndex: "asc" as const },
    include: yearInclude,
  },
  paths: {
    include: {
      experiments: { orderBy: { position: "asc" as const } },
      years: {
        orderBy: { yearIndex: "asc" as const },
        include: yearInclude,
      },
    },
  },
} as const;

const DB_PATH_KINDS = {
  continue: "CONTINUE",
  alternative: "ALTERNATIVE",
  unbound: "UNBOUND",
} as const satisfies Record<PlanPathKind, string>;

type DbPathKind = (typeof DB_PATH_KINDS)[PlanPathKind];

const pathKindFromDb = (kind: DbPathKind): PlanPathKind =>
  PLAN_PATH_KINDS.find((k) => DB_PATH_KINDS[k] === kind) as PlanPathKind;

export function mapYearToDto(y: {
  id: string;
  yearIndex: number;
  note: string | null;
  resourcesScore: number | null;
  interestScore: number | null;
  confidenceScore: number | null;
  coherenceScore: number | null;
  unverifiedScoreKeys: string[];
  aiGuidance: PlanYearAiGuidance | null;
  goals: { id: string; position: number; text: string }[];
  keywords: { id: string; position: number; text: string }[];
}): PlanYearDto {
  return {
    id: y.id,
    yearIndex: y.yearIndex as PlanYearDto["yearIndex"],
    note: y.note ?? undefined,
    scores: {
      resources: y.resourcesScore as PlanYearScores["resources"],
      interest: y.interestScore as PlanYearScores["interest"],
      confidence: y.confidenceScore as PlanYearScores["confidence"],
      coherence: y.coherenceScore as PlanYearScores["coherence"],
    },
    unverifiedScoreKeys: PLAN_SCORE_KEYS.filter((key: PlanScoreKey) =>
      y.unverifiedScoreKeys.includes(key),
    ),
    aiGuidance: y.aiGuidance
      ? {
          sourceGoalTexts: y.aiGuidance.sourceGoalTexts,
          checkpoint: y.aiGuidance.checkpoint,
          rationale: y.aiGuidance.rationale,
          evidenceQuestionIds: y.aiGuidance.evidenceQuestionIds,
          pivotCondition: y.aiGuidance.pivotCondition,
        }
      : undefined,
    goals: [...y.goals]
      .sort((a, b) => a.position - b.position)
      .map((g) => ({ id: g.id, position: g.position, text: g.text })),
    keywords: [...y.keywords]
      .sort((a, b) => a.position - b.position)
      .map((k) => ({ id: k.id, position: k.position, text: k.text })),
  };
}

/** One `PlanYear` create payload, shared by new plans and full replacement saves. */
export function mapYearPayloadToCreateData(y: PlanYearSavePayload) {
  return {
    yearIndex: y.yearIndex,
    note: y.note ?? null,
    resourcesScore: y.scores.resources,
    interestScore: y.scores.interest,
    confidenceScore: y.scores.confidence,
    coherenceScore: y.scores.coherence,
    unverifiedScoreKeys: y.unverifiedScoreKeys,
    goals: {
      create: y.goals.map((text, position) => ({ position, text })),
    },
    keywords: {
      create: y.keywords.map((text, position) => ({ position, text })),
    },
    ...(y.aiGuidance ? { aiGuidance: { create: y.aiGuidance } } : {}),
  };
}

type DbPath = {
  id: string;
  kind: DbPathKind;
  title: string;
  overview: string;
  appeal: string;
  appealQuestionIds: string[];
  requirements: string[];
  openQuestions: string[];
  marks: string[];
  resourcesScore: number | null;
  interestScore: number | null;
  confidenceScore: number | null;
  coherenceScore: number | null;
  experiments: { action: string; learning: string; nextUp: boolean; position: number }[];
  years: Array<Parameters<typeof mapYearToDto>[0]>;
};

export function mapPathToDto(path: DbPath): PlanPathDto {
  return {
    id: path.id,
    kind: pathKindFromDb(path.kind),
    title: path.title,
    overview: path.overview,
    appeal: path.appeal,
    appealQuestionIds: path.appealQuestionIds,
    requirements: path.requirements,
    openQuestions: path.openQuestions,
    marks: PLAN_PATH_MARKS.filter((mark) => path.marks.includes(mark)),
    scores: {
      resources: path.resourcesScore as PlanYearScores["resources"],
      interest: path.interestScore as PlanYearScores["interest"],
      confidence: path.confidenceScore as PlanYearScores["confidence"],
      coherence: path.coherenceScore as PlanYearScores["coherence"],
    },
    experiments: [...path.experiments]
      .sort((a, b) => a.position - b.position)
      .map(({ action, learning, nextUp }) => ({ action, learning, nextUp })),
    years: [...path.years].sort((a, b) => a.yearIndex - b.yearIndex).map(mapYearToDto),
  };
}

/** Column values for one path, shared by first save and full replacement saves. */
export function mapPathPayloadToCreateData(path: PlanPathSavePayload) {
  return {
    kind: DB_PATH_KINDS[path.kind],
    title: path.title,
    overview: path.overview,
    appeal: path.appeal,
    appealQuestionIds: path.appealQuestionIds,
    requirements: path.requirements,
    openQuestions: path.openQuestions,
    marks: path.marks,
    resourcesScore: path.scores.resources,
    interestScore: path.scores.interest,
    confidenceScore: path.scores.confidence,
    coherenceScore: path.scores.coherence,
    experiments: {
      create: path.experiments.map((experiment, position) => ({ ...experiment, position })),
    },
  };
}

export function mapPlanToResponse(plan: {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  years: Array<Parameters<typeof mapYearToDto>[0]>;
  paths: DbPath[];
}): SavedPlanResponse {
  return {
    planId: plan.id,
    userId: plan.userId,
    title: plan.title ?? undefined,
    years: [...plan.years]
      .sort((a, b) => a.yearIndex - b.yearIndex)
      .map(mapYearToDto),
    paths: [...plan.paths]
      .map(mapPathToDto)
      .sort((a, b) => PLAN_PATH_KINDS.indexOf(a.kind) - PLAN_PATH_KINDS.indexOf(b.kind)),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}

export async function getPlanByUserId(userId: string) {
  return prisma.plan.findUnique({
    where: { userId },
    include: planInclude,
  });
}

export async function getPlanByIdForUser(planId: string, userId: string) {
  return prisma.plan.findFirst({
    where: { id: planId, userId },
    include: planInclude,
  });
}
