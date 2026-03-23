import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/features/admin/lib/admin-guard";
import { isAiDraftEnabled, setAiDraftEnabled } from "@/features/admin/lib/ai-control";

export async function GET() {
  const guard = await requireAdminRequest();
  if (!guard.ok) return guard.response;

  const enabled = await isAiDraftEnabled();
  return NextResponse.json({ enabled });
}

export async function PATCH(req: Request) {
  const guard = await requireAdminRequest();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const enabled =
    typeof body === "object" &&
    body !== null &&
    "enabled" in body &&
    typeof (body as { enabled?: unknown }).enabled === "boolean"
      ? (body as { enabled: boolean }).enabled
      : null;

  if (enabled == null) {
    return NextResponse.json({ error: "enabled(boolean) is required" }, { status: 400 });
  }

  const next = await setAiDraftEnabled(enabled);
  return NextResponse.json({ enabled: next });
}
