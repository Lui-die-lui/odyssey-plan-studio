import { notFound, redirect } from "next/navigation";

import { getActiveSessionUser } from "@/features/auth/lib/session-user";
import { PlanPathsPdfDocument } from "@/features/plan/components/PlanPathsPdfDocument";
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

  const plan = mapPlanToResponse(row);
  const generatedAt = new Date();

  return plan.paths.length ? (
    <PlanPathsPdfDocument plan={plan} generatedAt={generatedAt} />
  ) : (
    <PlanSummaryPdfDocument plan={plan} generatedAt={generatedAt} />
  );
}
