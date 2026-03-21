/**
 * Clears any browser-side plan caches. Extend `PLAN_RELATED_STORAGE_KEYS` if you
 * add localStorage/sessionStorage keys. Zustand stores should call their own
 * `persist.clearStorage()` (or equivalent) from the same entry point.
 * React Query: call `queryClient.removeQueries({ queryKey: [...] })` here if added later.
 */
const PLAN_RELATED_STORAGE_KEYS = ["plan", "odyssey-plan", "my-plan"] as const;

export function clearPlanClientState(): void {
  if (typeof window === "undefined") return;

  for (const key of PLAN_RELATED_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore quota / private mode */
    }
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
