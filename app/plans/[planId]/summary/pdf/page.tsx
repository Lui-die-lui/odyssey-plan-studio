import { notFound, redirect } from "next/navigation";

import { getActiveSessionUser } from "@/features/auth/lib/session-user";
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
  const user = await getActiveSessionUser();

  if (!user) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/plans/${planId}/summary/pdf`)}`,
    );
  }

  const row = await getPlanByIdForUser(planId, user.id);
  if (!row) notFound();

  return (
    <PlanSummaryPdfDocument
      plan={mapPlanToResponse(row)}
      generatedAt={new Date()}
    />
  );
}
