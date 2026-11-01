import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ usedCount: null as number | null }));

vi.mock("@/lib/prisma", () => {
  const aiDraftUsage = {
    upsert: async () => {
      db.usedCount ??= 0;
    },
    updateMany: async ({
      where,
      data,
    }: {
      where: { usedCount: { lt?: number; gt?: number } };
      data: { usedCount: { increment?: number; decrement?: number } };
    }) => {
      const used = db.usedCount ?? 0;
      const { lt = Infinity, gt = -Infinity } = where.usedCount;
      if (used >= lt || used <= gt) return { count: 0 };
      db.usedCount = used + (data.usedCount.increment ?? 0) - (data.usedCount.decrement ?? 0);
      return { count: 1 };
    },
    findUnique: async () => (db.usedCount === null ? null : { usedCount: db.usedCount }),
  };
  return {
    prisma: {
      aiDraftUsage,
      $transaction: <T>(run: (tx: { aiDraftUsage: typeof aiDraftUsage }) => Promise<T>) =>
        run({ aiDraftUsage }),
    },
  };
});

import {
  MONTHLY_AI_DRAFT_LIMIT,
  consumeAiDraftQuota,
  getAiDraftMonthKey,
  refundAiDraftQuota,
} from "./ai-draft-quota";

describe("getAiDraftMonthKey", () => {
  it("formats the UTC month with padding", () => {
    expect(getAiDraftMonthKey(new Date("2026-03-31T23:59:59Z"))).toBe("2026-03");
    expect(getAiDraftMonthKey(new Date("2026-11-01T00:00:00Z"))).toBe("2026-11");
  });
});

describe("AI draft quota", () => {
  beforeEach(() => {
    db.usedCount = null;
  });

  it("charges up to the monthly limit, then refuses", async () => {
    for (let used = 1; used <= MONTHLY_AI_DRAFT_LIMIT; used += 1) {
      await expect(consumeAiDraftQuota("u", "2026-11")).resolves.toEqual({
        allowed: true,
        remaining: MONTHLY_AI_DRAFT_LIMIT - used,
      });
    }
    await expect(consumeAiDraftQuota("u", "2026-11")).resolves.toEqual({
      allowed: false,
      usedCount: MONTHLY_AI_DRAFT_LIMIT,
    });
  });

  it("restores a charge after a refund", async () => {
    db.usedCount = MONTHLY_AI_DRAFT_LIMIT;
    await refundAiDraftQuota("u", "2026-11");
    await expect(consumeAiDraftQuota("u", "2026-11")).resolves.toMatchObject({ allowed: true });
  });

  it("never refunds below zero", async () => {
    db.usedCount = 0;
    await refundAiDraftQuota("u", "2026-11");
    expect(db.usedCount).toBe(0);
  });
});
