import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/features/auth/lib/auth";

export async function requireAdminRequest() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, userId: user.id };
}
