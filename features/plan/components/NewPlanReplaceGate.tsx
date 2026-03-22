"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import ExistingPlanConfirmModal from "@/features/plan/components/ExistingPlanConfirmModal";
import {
  NEW_PLAN_REPLACE_QUERY,
  NEW_PLAN_REPLACE_VALUE,
} from "@/features/plan/constants/plan.constants";
import { useMyPlan } from "@/features/plan/hooks/useMyPlan";

const loadingBoxClass =
  "rounded-2xl border border-zinc-200/80 bg-white p-6 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300";

function NewPlanReplaceGateInner({ children }: { children: ReactNode }) {
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
        <div className={loadingBoxClass}>불러오는 중…</div>
      ) : showReplaceGate ? null : (
        children
      )}
    </>
  );
}

export function NewPlanReplaceGate({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<div className={loadingBoxClass}>불러오는 중…</div>}
    >
      <NewPlanReplaceGateInner>{children}</NewPlanReplaceGateInner>
    </Suspense>
  );
}
