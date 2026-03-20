import { useCallback, useEffect, useState } from "react";
import type { SavedPlanResponse } from "../types/plan.types";
import { getMyPlan } from "../lib/plan.service";

type UseMyPlanOptions = {
  autoLoad?: boolean;
};

export const useMyPlan = (opts?: UseMyPlanOptions) => {
  const autoLoad = opts?.autoLoad ?? true;

  const [plan, setPlan] = useState<SavedPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    fetchPlan();
  }, [autoLoad, fetchPlan]);

  return {
    plan,
    loading,
    error,
    refetch: fetchPlan,
  };
};

