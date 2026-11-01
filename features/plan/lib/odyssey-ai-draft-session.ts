import {
  PLAN_MAX_GOALS_PER_YEAR,
  PLAN_MAX_KEYWORDS_PER_YEAR,
  PLAN_MAX_LENGTH,
  PLAN_ODYSSEY_YEAR_INDICES,
} from "../constants/plan.constants";
import type {
  OdysseyAiPlanFormDraft,
  OdysseyLegacyAiPlanFormDraft,
  OdysseyLegacyAiPlanYearDraft,
} from "../interview/odyssey-ai-plan-draft.types";
import type { PlanFormValues } from "../types/plan.types";
import {
  mapOdysseyAiPlanFormToPlanFormValues,
  mapOdysseyLegacyAiPlanFormToPlanFormValues,
} from "./odyssey-ai-plan-draft.mapper";
import { validateOdysseyAiPlanForm } from "./odyssey-generate-response.validation";

export const ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY = "odyssey:ai-plan-form-draft:v2" as const;
export const ODYSSEY_LEGACY_AI_PLAN_DRAFT_STORAGE_KEY = "odyssey:ai-plan-form-draft:v1" as const;

type StoredPayload = {
  v: 2;
  planForm: OdysseyAiPlanFormDraft;
};

export function writeOdysseyAiPlanDraftToSession(planForm: OdysseyAiPlanFormDraft): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredPayload = { v: 2, planForm };
    sessionStorage.setItem(ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isStringList(v: unknown, max: number, maxLength: number): v is string[] {
  return (
    Array.isArray(v) &&
    v.length <= max &&
    v.every((s) => typeof s === "string" && s.trim().length > 0 && s.length <= maxLength)
  );
}

export function parseStoredDraft(raw: string): PlanFormValues | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 2) return null;
    // 저장된 초안의 근거 ID는 생성 시 검증되었고, 여기서는 구조만 다시 확인합니다.
    const result = validateOdysseyAiPlanForm(data.planForm, () => true);
    return result.ok ? mapOdysseyAiPlanFormToPlanFormValues(result.value) : null;
  } catch {
    return null;
  }
}

function parseLegacyYear(raw: unknown): OdysseyLegacyAiPlanYearDraft | null {
  if (!isRecord(raw)) return null;
  const { yearIndex, plans, keywords, note } = raw;
  if (!PLAN_ODYSSEY_YEAR_INDICES.some((idx) => idx === yearIndex)) return null;
  if (!isStringList(plans, PLAN_MAX_GOALS_PER_YEAR, PLAN_MAX_LENGTH.goal)) return null;
  if (!isStringList(keywords, PLAN_MAX_KEYWORDS_PER_YEAR, PLAN_MAX_LENGTH.keyword)) return null;
  if (note !== undefined && (typeof note !== "string" || note.length > PLAN_MAX_LENGTH.note)) {
    return null;
  }
  return { yearIndex: yearIndex as number, plans, keywords, note };
}

/** 배포 중 이전 버전에서 넘어온 v1 초안. 구조가 맞을 때만 문장을 살립니다. */
export function parseLegacyStoredDraft(raw: string): PlanFormValues | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.v !== 1 || !isRecord(data.planForm)) return null;
    const { title, years } = data.planForm;
    if (typeof title !== "string" || title.length > PLAN_MAX_LENGTH.title) return null;
    if (!Array.isArray(years)) return null;

    const parsedYears = years.map(parseLegacyYear);
    if (!parsedYears.every((y) => y !== null)) return null;
    const draft: OdysseyLegacyAiPlanFormDraft = { title, years: parsedYears };
    return mapOdysseyLegacyAiPlanFormToPlanFormValues(draft);
  } catch {
    return null;
  }
}

/** 키는 유지 (Strict Mode 이중 effect·peek 용) */
export function peekOdysseyAiPlanDraftFromSession(): PlanFormValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY);
    if (raw) return parseStoredDraft(raw);
    const legacy = sessionStorage.getItem(ODYSSEY_LEGACY_AI_PLAN_DRAFT_STORAGE_KEY);
    return legacy ? parseLegacyStoredDraft(legacy) : null;
  } catch {
    return null;
  }
}

export function clearOdysseyAiPlanDraftFromSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ODYSSEY_AI_PLAN_DRAFT_STORAGE_KEY);
    sessionStorage.removeItem(ODYSSEY_LEGACY_AI_PLAN_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
