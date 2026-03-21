import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import type { SavedPlanResponse } from "../types/plan.types";
import { getMyPlan } from "../lib/plan.service";

type UseMyPlanOptions = {
  autoLoad?: boolean;
};

export const useMyPlan = (opts?: UseMyPlanOptions) => {
  const autoLoad = opts?.autoLoad ?? true;
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [plan, setPlan] = useState<SavedPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!userId) {
      setPlan(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getMyPlan();
      setPlan(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load plan.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!autoLoad) return;

    if (status !== "authenticated" || !userId) {
      setPlan(null);
      setLoading(false);
      setError(null);
      return;
    }

    void fetchPlan();
  }, [autoLoad, fetchPlan, status, userId]);

  return {
    plan,
    loading,
    error,
    refetch: fetchPlan,
  };
};
