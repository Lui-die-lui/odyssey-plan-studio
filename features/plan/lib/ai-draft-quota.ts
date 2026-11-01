import { prisma } from "@/lib/prisma";

export const MONTHLY_AI_DRAFT_LIMIT = 2;

export function getAiDraftMonthKey(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Atomically charges one draft; the `lt` guard keeps concurrent requests under the limit. */
export async function consumeAiDraftQuota(userId: string, monthKey: string) {
  return prisma.$transaction(async (tx) => {
    await tx.aiDraftUsage.upsert({
      where: { userId_monthKey: { userId, monthKey } },
      create: { userId, monthKey, usedCount: 0 },
      update: {},
    });

    const updated = await tx.aiDraftUsage.updateMany({
      where: {
        userId,
        monthKey,
        usedCount: { lt: MONTHLY_AI_DRAFT_LIMIT },
      },
      data: { usedCount: { increment: 1 } },
    });

    const usage = await tx.aiDraftUsage.findUnique({
      where: { userId_monthKey: { userId, monthKey } },
      select: { usedCount: true },
    });
    const usedCount = usage?.usedCount ?? MONTHLY_AI_DRAFT_LIMIT;

    if (updated.count !== 1) {
      return { allowed: false as const, usedCount };
    }
    return {
      allowed: true as const,
      remaining: Math.max(0, MONTHLY_AI_DRAFT_LIMIT - usedCount),
    };
  });
}

/** Returns a charged draft when generation failed. Never throws: the caller is already handling an error. */
export async function refundAiDraftQuota(userId: string, monthKey: string) {
  try {
    await prisma.aiDraftUsage.updateMany({
      where: { userId, monthKey, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
  } catch (error) {
    console.error("[ai-draft-quota] refund failed", error);
  }
}
