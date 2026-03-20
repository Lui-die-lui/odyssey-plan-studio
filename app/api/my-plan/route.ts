import { NextResponse } from "next/server";

import type {
  SavedPlanResponse,
  SavePlanRequestPayload,
  UpdatePlanRequestPayload,
} from "@/features/plan/types/plan.types";

const MOCK_USER_ID = "mock-user";

const buildMockSavedPlan = (opts?: Partial<SavedPlanResponse>): SavedPlanResponse => {
  const nowIso = new Date().toISOString();

  return {
    planId: "mock-plan",
    title: "My Odyssey Plan",
    yearlyItems: [
      {
        year: new Date().getFullYear(),
        goal: "Focus on health and energy",
        summary: "Create habits that make the week feel lighter.",
        strengths: ["Consistency"],
        weaknesses: ["Overcommitting"],
      },
      {
        year: new Date().getFullYear() + 1,
        goal: "Build meaningful relationships",
        summary: "Make time for friends and community regularly.",
        strengths: ["Curiosity"],
        weaknesses: ["Avoiding hard conversations"],
      },
    ],
    userId: MOCK_USER_ID,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...opts,
  };
};

export async function GET() {
  const payload = buildMockSavedPlan();
  return NextResponse.json({ data: payload });
}

export async function POST(req: Request) {
  const body = (await req.json()) as SavePlanRequestPayload;

  const yearlyItems = Array.isArray(body?.yearlyItems)
    ? body.yearlyItems
    : [];

  const nowIso = new Date().toISOString();
  const saved: SavedPlanResponse = buildMockSavedPlan({
    planId: `mock-plan-${Date.now()}`,
    title: body?.title,
    yearlyItems,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  return NextResponse.json({ success: true, data: saved });
}

export async function PUT(req: Request) {
  const body = (await req.json()) as UpdatePlanRequestPayload;

  if (!body?.planId || typeof body.planId !== "string") {
    return NextResponse.json(
      {
        success: false,
        message: "Missing or invalid planId.",
      },
      { status: 400 },
    );
  }

  const yearlyItems = Array.isArray(body?.yearlyItems) ? body.yearlyItems : [];

  const nowIso = new Date().toISOString();
  const saved: SavedPlanResponse = buildMockSavedPlan({
    planId: body.planId,
    title: body?.title,
    yearlyItems,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  return NextResponse.json({ success: true, data: saved });
}

