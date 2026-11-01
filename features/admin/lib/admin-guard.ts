import { NextResponse } from "next/server";

import { getActiveSessionUser } from "@/features/auth/lib/session-user";

export async function requireAdminRequest() {
  const user = await getActiveSessionUser();

  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, userId: user.id };
}
