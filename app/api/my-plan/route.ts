import { NextResponse } from "next/server";

import { getActiveSessionUser } from "@/features/auth/lib/session-user";
import {
  getPlanByUserId,
  mapPathPayloadToCreateData,
  mapPreparationsToCreateData,
  mapPlanToResponse,
  mapYearPayloadToCreateData,
  planInclude,
} from "@/features/plan/lib/plan-db.server";
import { parseSavePlanBody } from "@/features/plan/lib/plan-save.validation";
import { prisma } from "@/lib/prisma";

type PrismaTransactionCallback = Extract<
  Parameters<typeof prisma.$transaction>[0],
  (...args: never[]) => unknown
>;
type PrismaTransactionClient = PrismaTransactionCallback extends (
  tx: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;

async function requireAuthenticatedUserId(): Promise<string | NextResponse> {
  const user = await getActiveSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    );
  }
  return user.id;
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
    const parsed = parseSavePlanBody(rawBody);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, message: parsed.message },
        { status: 400 },
      );
    }
    const { title, years, paths, sharedPreparations } = parsed.data;

    const writePaths = async (tx: PrismaTransactionClient, planId: string) => {
      if (!paths) return;
      await tx.planPreparation.createMany({
        data: mapPreparationsToCreateData(sharedPreparations ?? [], planId, null),
      });
      for (const path of paths) {
        const { id: pathId } = await tx.planPath.create({
          data: { planId, ...mapPathPayloadToCreateData(path) },
        });
        await tx.planPreparation.createMany({
          data: mapPreparationsToCreateData(path.preparations, planId, pathId),
        });
        for (const year of path.years) {
          await tx.planYear.create({
            data: { planId, pathId, ...mapYearPayloadToCreateData(year) },
          });
        }
      }
    };

    const existingPlan = await prisma.plan.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!existingPlan) {
      const createdId = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
        const { id } = await tx.plan.create({
          data: {
            userId,
            title: title ?? null,
            years: { create: (years ?? []).map(mapYearPayloadToCreateData) },
          },
        });
        await writePaths(tx, id);
        return id;
      });

      const created = await prisma.plan.findUniqueOrThrow({
        where: { id: createdId },
        include: planInclude,
      });

      return NextResponse.json(
        { success: true, data: mapPlanToResponse(created) },
        { status: 201 },
      );
    }

    const planId = existingPlan.id;

    await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      // Only what the request carries is replaced; the other part stays as saved.
      if (years) {
        await tx.planYear.deleteMany({ where: { planId, pathId: null } });
        await tx.plan.update({
          where: { id: planId },
          data: { title: title ?? null },
        });
        for (const y of years) {
          await tx.planYear.create({
            data: { planId, ...mapYearPayloadToCreateData(y) },
          });
        }
      }

      if (paths) {
        await tx.planPreparation.deleteMany({ where: { planId } });
        await tx.planPath.deleteMany({ where: { planId } });
        await writePaths(tx, planId);
        if (title !== undefined && !years) {
          await tx.plan.update({ where: { id: planId }, data: { title } });
        }
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
