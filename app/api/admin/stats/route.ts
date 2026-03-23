import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/features/admin/lib/admin-guard";
import { getAdminKpis } from "@/features/admin/lib/stats";

export async function GET() {
  const guard = await requireAdminRequest();
  if (!guard.ok) return guard.response;

  const data = await getAdminKpis();
  return NextResponse.json(data);
}
