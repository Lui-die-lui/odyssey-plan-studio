import { NextResponse } from "next/server";

import { getActiveSessionUser } from "@/features/auth/lib/session-user";
import {
  MONTHLY_AI_DRAFT_LIMIT,
  getAiDraftMonthKey,
} from "@/features/plan/lib/ai-draft-quota";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getActiveSessionUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = user.id;
  const monthKey = getAiDraftMonthKey();

  const [usage, aiConfig, userState] = await Promise.all([
    prisma.aiDraftUsage.findUnique({
      where: { userId_monthKey: { userId, monthKey } },
      select: { usedCount: true },
    }),
    prisma.systemConfig.findUnique({
      where: { key: "AI_DRAFT_ENABLED" },
      select: { value: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { aiBlocked: true },
    }),
  ]);

  const used = usage?.usedCount ?? 0;
  const remaining = Math.max(0, MONTHLY_AI_DRAFT_LIMIT - used);
  const globallyDisabled = aiConfig?.value === "false";
  const userBlocked = userState?.aiBlocked === true;
  const quotaExhausted = remaining === 0;

  let blockedReason: "GLOBAL_AI_OFF" | "USER_AI_BLOCKED" | "QUOTA_EXHAUSTED" | null = null;
  if (globallyDisabled) blockedReason = "GLOBAL_AI_OFF";
  else if (userBlocked) blockedReason = "USER_AI_BLOCKED";
  else if (quotaExhausted) blockedReason = "QUOTA_EXHAUSTED";

  const canUseGuided = blockedReason == null;

  return NextResponse.json({
    limit: MONTHLY_AI_DRAFT_LIMIT,
    used,
    remaining,
    monthKey,
    canUseGuided,
    blockedReason,
  });
}
