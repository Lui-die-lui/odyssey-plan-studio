import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";

const MONTHLY_AI_DRAFT_LIMIT = 2;

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (typeof userId !== "string" || !userId.length) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const delegate = prisma as unknown as {
    aiDraftUsage: {
      findUnique: (args: unknown) => Promise<{ usedCount: number } | null>;
    };
    systemConfig: {
      findUnique: (args: unknown) => Promise<{ value: string } | null>;
    };
    user: {
      findUnique: (args: unknown) => Promise<{ aiBlocked: boolean } | null>;
    };
  };

  const [usage, aiConfig, userState] = await Promise.all([
    delegate.aiDraftUsage.findUnique({
      where: { userId_monthKey: { userId, monthKey } },
      select: { usedCount: true },
    }),
    delegate.systemConfig.findUnique({
      where: { key: "AI_DRAFT_ENABLED" },
      select: { value: true },
    }),
    delegate.user.findUnique({
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
