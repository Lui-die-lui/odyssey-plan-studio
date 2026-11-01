import type { PlanFormValues } from "../types/plan.types";
import { normalizePlanFormValues } from "./plan.mapper";

const AUTOSAVE_KEY_PREFIX = "odyssey:plan-form:";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parsePlanFormAutosave(raw: string): PlanFormValues | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || !Array.isArray(data.years) || !data.years.length) return null;
    if (!data.years.every(isRecord)) return null;
    return normalizePlanFormValues(data as PlanFormValues);
  } catch {
    return null;
  }
}

/** Unsaved form copy for this tab, so navigating away or refreshing loses nothing. */
export function readPlanFormAutosave(key: string): PlanFormValues | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTOSAVE_KEY_PREFIX + key);
    return raw ? parsePlanFormAutosave(raw) : null;
  } catch {
    return null;
  }
}

export function writePlanFormAutosave(key: string, values: PlanFormValues): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTOSAVE_KEY_PREFIX + key, JSON.stringify(values));
  } catch {
    /* quota / private mode */
  }
}

/** Path details saved next to the year forms; validated again on save. */
export function readPathContentAutosave(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTOSAVE_KEY_PREFIX + key);
    const data: unknown = raw ? JSON.parse(raw) : null;
    return isRecord(data) ? data : null;
  } catch {
    return null;
  }
}

export function writePathContentAutosave(key: string, contents: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AUTOSAVE_KEY_PREFIX + key, JSON.stringify(contents));
  } catch {
    /* quota / private mode */
  }
}

export function clearPlanFormAutosave(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AUTOSAVE_KEY_PREFIX + key);
  } catch {
    /* ignore */
  }
}
