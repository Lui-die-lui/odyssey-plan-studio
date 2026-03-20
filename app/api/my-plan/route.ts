import { NextResponse } from "next/server";

import type {
  SavedPlanResponse,
  SavePlanRequestPayload,
  UpdatePlanRequestPayload,
} from "@/features/plan/types/plan.types";

import { prisma } from "@/lib/prisma";

// Temporary fixed user (until OAuth2 is added).
const TEMP_USER_PROVIDER = "temp";
const TEMP_USER_PROVIDER_USER_ID = "mock-user";

const normalizeOptionalString = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length ? trimmed : undefined;
};

const jsonToStringArray = (value: unknown): string[] | undefined => {
  if (!value) return undefined;
  if (!Array.isArray(value)) return undefined;
  if (!value.every((v) => typeof v === "string")) return undefined;
  return value as string[];
};

const normalizeStrengthsOrWeaknesses = (
  values?: string[],
): string[] | undefined => {
  if (!values?.length) return undefined;

  const normalized = values.map((value) => value.trim()).filter(Boolean);

  return normalized.length ? normalized : undefined;
};

const dedupeYearlyItemsByYear = (
  yearlyItems: SavePlanRequestPayload["yearlyItems"],
) => {
  const map = new Map<number, (typeof yearlyItems)[number]>();

  for (const item of yearlyItems) {
    map.set(item.year, item);
  }

  return [...map.values()].sort((a, b) => a.year - b.year);
};

const buildYearlyItemsCreateInput = (
  yearlyItems: SavePlanRequestPayload["yearlyItems"],
  planId: string,
) => {
  const deduped = dedupeYearlyItemsByYear(yearlyItems);

  return deduped.map((item) => ({
    planId,
    year: item.year,
    goal: item.goal,
    summary: item.summary,
    strengths: normalizeStrengthsOrWeaknesses(item.strengths),
    weaknesses: normalizeStrengthsOrWeaknesses(item.weaknesses),
  }));
};

const buildYearlyItemsNestedCreateInput = (
  yearlyItems: SavePlanRequestPayload["yearlyItems"],
) => {
  const deduped = dedupeYearlyItemsByYear(yearlyItems);

  return deduped.map((item) => ({
    year: item.year,
    goal: item.goal,
    summary: item.summary,
    strengths: normalizeStrengthsOrWeaknesses(item.strengths),
    weaknesses: normalizeStrengthsOrWeaknesses(item.weaknesses),
  }));
};

const mapYearPlanItemToResponse = (item: {
  id: string;
  year: number;
  goal: string;
  summary: string;
  strengths: unknown;
  weaknesses: unknown;
}): SavedPlanResponse["yearlyItems"][number] => {
  return {
    id: item.id,
    year: item.year,
    goal: item.goal,
    summary: item.summary,
    strengths: jsonToStringArray(item.strengths),
    weaknesses: jsonToStringArray(item.weaknesses),
  };
};

const mapPlanToSavedPlanResponse = (plan: {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  yearItems: Array<{
    id: string;
    year: number;
    goal: string;
    summary: string;
    strengths: unknown;
    weaknesses: unknown;
  }>;
}): SavedPlanResponse => {
  return {
    planId: plan.id,
    userId: plan.userId,
    title: plan.title ?? undefined,
    yearlyItems: plan.yearItems.map(mapYearPlanItemToResponse),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
};

const getOrCreateTempUser = async () => {
  const existing = await prisma.user.findUnique({
    where: {
      provider_providerUserId: {
        provider: TEMP_USER_PROVIDER,
        providerUserId: TEMP_USER_PROVIDER_USER_ID,
      },
    },
  });

  if (existing) return existing;

  return prisma.user.create({
    data: {
      provider: TEMP_USER_PROVIDER,
      providerUserId: TEMP_USER_PROVIDER_USER_ID,
    },
  });
};

export async function GET() {
  try {
    const user = await getOrCreateTempUser();

    const plan = await prisma.plan.findUnique({
      where: { userId: user.id },
      include: {
        yearItems: {
          orderBy: { year: "asc" },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json(
      { data: mapPlanToSavedPlanResponse(plan) },
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SavePlanRequestPayload;

    const yearlyItems = Array.isArray(body?.yearlyItems) ? body.yearlyItems : [];
    const user = await getOrCreateTempUser();
    const normalizedTitle = normalizeOptionalString(body?.title);

    const existingPlan = await prisma.plan.findUnique({
      where: { userId: user.id },
      include: {
        yearItems: {
          orderBy: { year: "asc" },
        },
      },
    });

    if (!existingPlan) {
      const created = await prisma.plan.create({
        data: {
          userId: user.id,
          title: normalizedTitle,
          yearItems: {
            create: buildYearlyItemsNestedCreateInput(yearlyItems),
          },
        },
        include: {
          yearItems: {
            orderBy: { year: "asc" },
          },
        },
      });

      return NextResponse.json(
        { success: true, data: mapPlanToSavedPlanResponse(created) },
        { status: 201 },
      );
    }

    const planId = existingPlan.id;
    const createInput = buildYearlyItemsCreateInput(yearlyItems, planId);

    await prisma.$transaction(async (tx) => {
      await tx.yearPlanItem.deleteMany({
        where: { planId },
      });

      await tx.plan.update({
        where: { id: planId },
        data: { title: normalizedTitle },
      });

      if (createInput.length) {
        await tx.yearPlanItem.createMany({
          data: createInput,
        });
      }
    });

    const updatedPlan = await prisma.plan.findUnique({
      where: { userId: user.id },
      include: {
        yearItems: {
          orderBy: { year: "asc" },
        },
      },
    });

    if (!updatedPlan) {
      return NextResponse.json(
        { success: false, message: "Plan disappeared during update." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: mapPlanToSavedPlanResponse(updatedPlan) },
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

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as UpdatePlanRequestPayload;

    if (!body?.planId || typeof body.planId !== "string") {
      return NextResponse.json(
        { success: false, message: "Missing or invalid planId." },
        { status: 400 },
      );
    }

    const yearlyItems = Array.isArray(body?.yearlyItems) ? body.yearlyItems : [];
    const user = await getOrCreateTempUser();
    const planId = body.planId;
    const normalizedTitle = normalizeOptionalString(body?.title);

    const existingPlan = await prisma.plan.findFirst({
      where: {
        id: planId,
        userId: user.id,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, message: "Plan not found." },
        { status: 404 },
      );
    }

    const createInput = buildYearlyItemsCreateInput(yearlyItems, planId);

    await prisma.$transaction(async (tx) => {
      await tx.yearPlanItem.deleteMany({
        where: { planId },
      });

      await tx.plan.update({
        where: { id: planId },
        data: { title: normalizedTitle },
      });

      if (createInput.length) {
        await tx.yearPlanItem.createMany({
          data: createInput,
        });
      }
    });

    const updatedPlan = await prisma.plan.findFirst({
      where: {
        id: planId,
        userId: user.id,
      },
      include: {
        yearItems: {
          orderBy: { year: "asc" },
        },
      },
    });

    if (!updatedPlan) {
      return NextResponse.json(
        { success: false, message: "Plan disappeared during update." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, data: mapPlanToSavedPlanResponse(updatedPlan) },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/my-plan error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update plan." },
      { status: 500 },
    );
  }
}