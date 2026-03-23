import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";

const MS_IN_7_DAYS = 7 * 24 * 60 * 60 * 1000;

export async function POST() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (typeof userId !== "string" || !userId.length) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const hardDeleteAt = new Date(now.getTime() + MS_IN_7_DAYS);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true, hardDeleteAt: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
  }

  if (user.status === "PENDING_DELETION") {
    return NextResponse.json(
      {
        success: false,
        message: "이미 탈퇴 요청이 접수되어 유예 기간 중입니다.",
      },
      { status: 409 },
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "PENDING_DELETION",
      withdrawRequestedAt: now,
      hardDeleteAt,
    },
  });

  // Client에서 signOut으로 세션을 즉시 종료하도록 안내합니다.
  return NextResponse.json({
    success: true,
    hardDeleteAt,
  });
}

