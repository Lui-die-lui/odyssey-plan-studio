import type { OdysseyAiPlanFormDraft } from "../interview/odyssey-ai-plan-draft.types";

export const ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY = "odyssey:ai-plan-form-draft:v1" as const;

type StoredPayload = {
  v: 1;
  planForm: OdysseyAiPlanFormDraft;
};

export function writeOdysseyAiPlanDraftToSession(planForm: OdysseyAiPlanFormDraft): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredPayload = { v: 1, planForm };
    sessionStorage.setItem(ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function parseStoredPayload(raw: string): OdysseyAiPlanFormDraft | null {
  try {
    const data = JSON.parse(raw) as StoredPayload;
    if (data?.v !== 1 || !data.planForm || !Array.isArray(data.planForm.years)) {
      return null;
    }
    return data.planForm;
  } catch {
    return null;
  }
}

/** 키는 유지 (Strict Mode 이중 effect·peek 용) */
export function peekOdysseyAiPlanDraftFromSession(): OdysseyAiPlanFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return parseStoredPayload(raw);
  } catch {
    return null;
  }
}

export function clearOdysseyAiPlanDraftFromSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 한 번에 읽고 제거 (단일 호출 전제).
 * 클라이언트 `useLayoutEffect`에서는 Strict Mode에서 이중 호출되므로
 * `peek` + 지연 `clear` 패턴을 쓰는 것이 안전합니다.
 */
export function readAndClearOdysseyAiPlanDraftFromSession(): OdysseyAiPlanFormDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY);
    clearOdysseyAiPlanDraftFromSession();
    if (!raw) return null;
    return parseStoredPayload(raw);
  } catch {
    return null;
  }
}
