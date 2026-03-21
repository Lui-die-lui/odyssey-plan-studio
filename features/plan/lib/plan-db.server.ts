import type { PlanYearDto, PlanYearScores, SavedPlanResponse } from "../types/plan.types";
import { prisma } from "@/lib/prisma";

export const planInclude = {
  years: {
    orderBy: { yearIndex: "asc" as const },
    include: {
      goals: { orderBy: { position: "asc" as const } },
      keywords: { orderBy: { position: "asc" as const } },
    },
  },
} as const;

export function mapYearToDto(y: {
  id: string;
  yearIndex: number;
  note: string | null;
  resourcesScore: number;
  interestScore: number;
  confidenceScore: number;
  coherenceScore: number;
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
    goals: [...y.goals]
      .sort((a, b) => a.position - b.position)
      .map((g) => ({ id: g.id, position: g.position, text: g.text })),
    keywords: [...y.keywords]
      .sort((a, b) => a.position - b.position)
      .map((k) => ({ id: k.id, position: k.position, text: k.text })),
  };
}

export function mapPlanToResponse(plan: {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  years: Array<Parameters<typeof mapYearToDto>[0]>;
}): SavedPlanResponse {
  return {
    planId: plan.id,
    userId: plan.userId,
    title: plan.title ?? undefined,
    years: [...plan.years]
      .sort((a, b) => a.yearIndex - b.yearIndex)
      .map(mapYearToDto),
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
