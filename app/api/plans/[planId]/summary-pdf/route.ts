import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth/lib/auth";
import { getPlanByIdForUser } from "@/features/plan/lib/plan-db.server";
import { getRequestOrigin } from "@/features/plan/lib/request-origin.server";
import { renderPlanSummaryPdfFromUrl } from "@/features/plan/lib/render-plan-summary-pdf.server";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ planId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (typeof userId !== "string" || !userId.length) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { planId } = await context.params;
  const row = await getPlanByIdForUser(planId, userId);
  if (!row) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const origin = getRequestOrigin(request);
  const printUrl = `${origin}/plans/${planId}/summary/pdf`;
  const cookie = request.headers.get("cookie");

  try {
    const buffer = await renderPlanSummaryPdfFromUrl(printUrl, cookie);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="odyssey-plan-summary.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET summary-pdf:", error);
    return NextResponse.json(
      { message: "PDF generation failed." },
      { status: 500 },
    );
  }
}
