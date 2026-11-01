/**
 * Clears any browser-side plan caches. Extend `PLAN_RELATED_STORAGE_KEYS` if you
 * add localStorage/sessionStorage keys. Zustand stores should call their own
 * `persist.clearStorage()` (or equivalent) from the same entry point.
 * React Query: call `queryClient.removeQueries({ queryKey: [...] })` here if added later.
 */
const PLAN_RELATED_STORAGE_KEYS = [
  "plan",
  "odyssey-plan",
  "my-plan",
  "odyssey:ai-plan-form-draft:v1",
  "odyssey:ai-plan-form-draft:v2",
  "odyssey:ai-plan-form-draft:v3",
  "odyssey:interview:v1",
] as const;

/** Unsaved form copies use one key per plan, so they are cleared by prefix. */
const PLAN_AUTOSAVE_KEY_PREFIX = "odyssey:plan-form:";

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

  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(PLAN_AUTOSAVE_KEY_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
