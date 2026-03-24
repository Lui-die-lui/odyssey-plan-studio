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
  "rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-white/10 dark:bg-zinc-950";

function ReplaceGateSkeleton() {
  return (
    <div className={loadingBoxClass} aria-hidden>
      <div className="flex flex-col gap-3">
        <span className="h-4 w-32 animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
        <span className="h-4 w-full animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/60" />
      </div>
    </div>
  );
}

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
        <ReplaceGateSkeleton />
      ) : showReplaceGate ? null : (
        children
      )}
    </>
  );
}

export function NewPlanReplaceGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ReplaceGateSkeleton />}>
      <NewPlanReplaceGateInner>{children}</NewPlanReplaceGateInner>
    </Suspense>
  );
}
