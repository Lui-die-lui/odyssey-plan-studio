import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth/lib/auth";
import { PlanSummaryPdfDocument } from "@/features/plan/components/PlanSummaryPdfDocument";
import {
  getPlanByIdForUser,
  mapPlanToResponse,
} from "@/features/plan/lib/plan-db.server";

type PageProps = {
  params: Promise<{ planId: string }>;
};

export const dynamic = "force-dynamic";

export default async function PlanSummaryPdfPage({ params }: PageProps) {
  const { planId } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (typeof userId !== "string" || !userId.length) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/plans/${planId}/summary/pdf`)}`,
    );
  }

  const row = await getPlanByIdForUser(planId, userId);
  if (!row) notFound();

  return (
    <PlanSummaryPdfDocument
      plan={mapPlanToResponse(row)}
      generatedAt={new Date()}
    />
  );
}
