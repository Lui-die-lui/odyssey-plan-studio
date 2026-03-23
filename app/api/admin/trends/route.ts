import { NextResponse } from "next/server";

import { requireAdminRequest } from "@/features/admin/lib/admin-guard";
import { getTrendSeries, type TrendGranularity } from "@/features/admin/lib/trends";

function parseGranularity(value: string | null): TrendGranularity {
  if (value === "week" || value === "month") return value;
  return "day";
}

export async function GET(req: Request) {
  const guard = await requireAdminRequest();
  if (!guard.ok) return guard.response;

  const granularity = parseGranularity(new URL(req.url).searchParams.get("granularity"));
  const rows = await getTrendSeries(granularity);

  return NextResponse.json({ granularity, rows });
}
