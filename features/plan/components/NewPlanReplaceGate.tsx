"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import ExistingPlanConfirmModal from "@/features/plan/components/ExistingPlanConfirmModal";
import {
  NEW_PLAN_REPLACE_QUERY,
  NEW_PLAN_REPLACE_VALUE,
} from "@/features/plan/constants/plan.constants";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";

type NewPlanReplaceGateProps = {
  children: ReactNode;
  /** Page-shaped skeleton shown while checking for an existing plan. */
  fallback: ReactNode;
};

function NewPlanReplaceGateInner({ children, fallback }: NewPlanReplaceGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { plan, loading } = useMyPlan({ autoLoad: true });

  const replaceAcknowledged =
    searchParams.get(NEW_PLAN_REPLACE_QUERY) === NEW_PLAN_REPLACE_VALUE;
  const showReplaceGate = !loading && plan !== null && !replaceAcknowledged;

  const acknowledgeReplace = () => {
    router.replace(
      `${pathname}?${NEW_PLAN_REPLACE_QUERY}=${NEW_PLAN_REPLACE_VALUE}`,
    );
  };

  return (
    <>
      <ExistingPlanConfirmModal
        open={showReplaceGate}
        onCancel={() => router.push("/my-plan")}
        onConfirm={acknowledgeReplace}
      />
      {loading ? (
        fallback
      ) : showReplaceGate ? null : (
        children
      )}
    </>
  );
}

export function NewPlanReplaceGate({ children, fallback }: NewPlanReplaceGateProps) {
  return (
    <Suspense fallback={fallback}>
      <NewPlanReplaceGateInner fallback={fallback}>{children}</NewPlanReplaceGateInner>
    </Suspense>
  );
}
