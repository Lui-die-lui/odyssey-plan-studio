import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/features/admin/lib/admin-guard";
import { getAdminUserAiState } from "@/features/admin/lib/ai-control";

export async function GET(req: Request) {
  const guard = await requireAdminRequest();
  if (!guard.ok) return guard.response;

  const sp = new URL(req.url).searchParams;
  const limitRaw = Number(sp.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50;

  const users = await getAdminUserAiState(limit);
  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    })),
  });
}
