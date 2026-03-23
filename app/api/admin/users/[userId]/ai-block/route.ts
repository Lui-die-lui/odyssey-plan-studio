import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/features/admin/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const guard = await requireAdminRequest();
  if (!guard.ok) return guard.response;

  const { userId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const aiBlocked =
    typeof body === "object" &&
    body !== null &&
    "aiBlocked" in body &&
    typeof (body as { aiBlocked?: unknown }).aiBlocked === "boolean"
      ? (body as { aiBlocked: boolean }).aiBlocked
      : null;

  if (aiBlocked == null) {
    return NextResponse.json({ error: "aiBlocked(boolean) is required" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { aiBlocked },
    select: { id: true, aiBlocked: true },
  });

  return NextResponse.json(updated);
}
