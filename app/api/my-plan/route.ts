import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import type { PlanYearScores, SavePlanRequestPayload } from "@/features/plan/types/plan.types";

import { authOptions } from "@/features/auth/lib/auth";
import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
  PLAN_SCORE_MAX,
  PLAN_SCORE_MIN,
} from "@/features/plan/constants/plan.constants";
import {
  getPlanByUserId,
  mapPlanToResponse,
  planInclude,
} from "@/features/plan/lib/plan-db.server";
import { prisma } from "@/lib/prisma";

const normalizeOptionalString = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length ? trimmed : undefined;
};

const clampScore = (n: unknown): number => {
  const v = Math.round(Number(n));
  return Math.min(PLAN_SCORE_MAX, Math.max(PLAN_SCORE_MIN, v));
};

const parseScores = (raw: unknown): PlanYearScores | null => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    resources: clampScore(o.resources) as PlanYearScores["resources"],
    interest: clampScore(o.interest) as PlanYearScores["interest"],
    confidence: clampScore(o.confidence) as PlanYearScores["confidence"],
    coherence: clampScore(o.coherence) as PlanYearScores["coherence"],
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

async function requireAuthenticatedUserId(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (typeof userId !== "string" || !userId.length) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }
  return userId;
}

function validateSaveBody(body: unknown): SavePlanRequestPayload | NextResponse {
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const o = body as Record<string, unknown>;
  const title =
    o.title === undefined || o.title === null
      ? undefined
      : typeof o.title === "string"
        ? normalizeOptionalString(o.title)
        : null;
  if (title === null) {
    return NextResponse.json(
      { success: false, message: "Invalid title." },
      { status: 400 },
    );
  }
  if (title && title.length > PLAN_MAX_LENGTH.title) {
    return NextResponse.json(
      { success: false, message: "Title too long." },
      { status: 400 },
    );
  }

  if (!Array.isArray(o.years)) {
    return NextResponse.json(
      { success: false, message: "years must be an array." },
      { status: 400 },
    );
  }

  const byIndex = new Map<number, (typeof o.years)[number]>();
  for (const row of o.years) {
    if (!row || typeof row !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid year entry." },
        { status: 400 },
      );
    }
    const yr = row as Record<string, unknown>;
    const yearIndex = Number(yr.yearIndex);
    if (
      !Number.isInteger(yearIndex) ||
      !(PLAN_ODYSSEY_YEAR_INDICES as readonly number[]).includes(yearIndex)
    ) {
      return NextResponse.json(
        { success: false, message: "yearIndex must be 1–5." },
        { status: 400 },
      );
    }
    if (byIndex.has(yearIndex)) {
      return NextResponse.json(
        { success: false, message: "Duplicate yearIndex." },
        { status: 400 },
      );
    }
    byIndex.set(yearIndex, row);
  }

  const years: SavePlanRequestPayload["years"] = [];

  for (const idx of PLAN_ODYSSEY_YEAR_INDICES) {
    const row = byIndex.get(idx);
    if (!row) {
      return NextResponse.json(
        { success: false, message: `Missing year ${idx}.` },
        { status: 400 },
      );
    }
    const yr = row as Record<string, unknown>;

    const noteRaw = yr.note;
    const note =
      noteRaw === undefined || noteRaw === null
        ? undefined
        : typeof noteRaw === "string"
          ? normalizeOptionalString(noteRaw)
          : null;
    if (note === null) {
      return NextResponse.json(
        { success: false, message: `Invalid note for year ${idx}.` },
        { status: 400 },
      );
    }
    if (note && note.length > PLAN_MAX_LENGTH.note) {
      return NextResponse.json(
        { success: false, message: `Note too long for year ${idx}.` },
        { status: 400 },
      );
    }

    const scores = parseScores(yr.scores);
    if (!scores) {
      return NextResponse.json(
        { success: false, message: `Invalid scores for year ${idx}.` },
        { status: 400 },
      );
    }

    const goalsParsed = parseBoundedStringList(
      yr.goals,
      PLAN_MAX_GOALS_PER_YEAR,
      PLAN_MAX_LENGTH.goal,
      "goals",
    );
    if (!goalsParsed.ok) {
      return NextResponse.json(
        { success: false, message: `${goalsParsed.message} (year ${idx})` },
        { status: 400 },
      );
    }

    const keywordsParsed = parseBoundedStringList(
      yr.keywords,
      PLAN_MAX_KEYWORDS_PER_YEAR,
      PLAN_MAX_LENGTH.keyword,
      "keywords",
    );
    if (!keywordsParsed.ok) {
      return NextResponse.json(
        { success: false, message: `${keywordsParsed.message} (year ${idx})` },
        { status: 400 },
      );
    }

    years.push({
      yearIndex: idx,
      note,
      scores,
      goals: goalsParsed.values,
      keywords: keywordsParsed.values,
    });
  }

  const totalGoals = years.reduce((n, y) => n + y.goals.length, 0);
  if (totalGoals === 0) {
    return NextResponse.json(
      { success: false, message: "At least one goal is required." },
      { status: 400 },
    );
  }

  return { title, years };
}

export async function GET() {
  try {
    const userIdOrError = await requireAuthenticatedUserId();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const plan = await getPlanByUserId(userId);

    if (!plan) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json(
      { data: mapPlanToResponse(plan) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/my-plan error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load plan." },
      { status: 500 },
    );
  }
}

/**
 * Upsert: one plan per user; replaces all five year blocks and nested goals/keywords.
 */
export async function POST(req: Request) {
  try {
    const userIdOrError = await requireAuthenticatedUserId();
    if (userIdOrError instanceof NextResponse) return userIdOrError;
    const userId = userIdOrError;

    const rawBody: unknown = await req.json().catch(() => null);
    const parsed = validateSaveBody(rawBody);
    if (parsed instanceof NextResponse) return parsed;
    const { title, years } = parsed;

    const existingPlan = await prisma.plan.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existingPlan) {
      const created = await prisma.plan.create({
        data: {
          userId,
          title: title ?? null,
          years: {
            create: years.map((y) => ({
              yearIndex: y.yearIndex,
              note: y.note ?? null,
              resourcesScore: y.scores.resources,
              interestScore: y.scores.interest,
              confidenceScore: y.scores.confidence,
              coherenceScore: y.scores.coherence,
              goals: {
                create: y.goals.map((text, position) => ({ position, text })),
              },
              keywords: {
                create: y.keywords.map((text, position) => ({
                  position,
                  text,
                })),
              },
            })),
          },
        },
        include: planInclude,
      });

      return NextResponse.json(
        { success: true, data: mapPlanToResponse(created) },
        { status: 201 },
      );
    }

    const planId = existingPlan.id;

    await prisma.$transaction(async (tx) => {
      await tx.planYear.deleteMany({ where: { planId } });

      await tx.plan.update({
        where: { id: planId },
        data: { title: title ?? null },
      });

      for (const y of years) {
        await tx.planYear.create({
          data: {
            planId,
            yearIndex: y.yearIndex,
            note: y.note ?? null,
            resourcesScore: y.scores.resources,
            interestScore: y.scores.interest,
            confidenceScore: y.scores.confidence,
            coherenceScore: y.scores.coherence,
            goals: {
              create: y.goals.map((text, position) => ({ position, text })),
            },
            keywords: {
              create: y.keywords.map((text, position) => ({ position, text })),
            },
          },
        });
      }
    });

    const updated = await prisma.plan.findUnique({
      where: { userId },
      include: planInclude,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Plan disappeared during update." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: mapPlanToResponse(updated) },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/my-plan error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save plan." },
      { status: 500 },
    );
  }
}
