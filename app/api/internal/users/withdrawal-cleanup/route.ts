import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const MS_IN_7_DAYS = 7 * 24 * 60 * 60 * 1000;

async function verifyInternalRequest(req: Request) {
  const expected = process.env.WITHDRAWAL_CLEANUP_SECRET;
  if (!expected) return false;

  const headerToken = req.headers.get("x-internal-token");
  const queryToken = new URL(req.url).searchParams.get("token");

  return Boolean(headerToken && headerToken === expected) || Boolean(queryToken && queryToken === expected);
}

export async function POST(req: Request) {
  const ok = await verifyInternalRequest(req);
  if (!ok) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();

  // PENDING_DELETION + 7일 경과된 계정 하드 삭제
  const result = await prisma.user.deleteMany({
    where: {
      status: "PENDING_DELETION",
      hardDeleteAt: {
        lte: now,
      },
    },
  });

  // (주의) schema cascade onDelete으로 Plan/PlanYear/Goal/Keyword까지 함께 정리됩니다.
  return NextResponse.json({
    success: true,
    deletedCount: result.count,
    hardDeleteAtCutoff: now,
    // Helps debug in case you want to compare expected schedule.
    msIn7Days: MS_IN_7_DAYS,
  });
}

