import { NextResponse } from "next/server";

import { isAuthorizedInternalRequest } from "@/lib/internal-auth";
import { prisma } from "@/lib/prisma";

const MS_IN_7_DAYS = 7 * 24 * 60 * 60 * 1000;

async function runCleanup(req: Request) {
  if (!isAuthorizedInternalRequest(req)) {
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

/** Vercel Cron invokes jobs with GET. */
export async function GET(req: Request) {
  return runCleanup(req);
}

export async function POST(req: Request) {
  return runCleanup(req);
}
