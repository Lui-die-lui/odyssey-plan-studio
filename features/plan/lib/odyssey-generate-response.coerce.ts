import type { OdysseyAiPlanFormDraft } from "../interview/odyssey-ai-plan-draft.types";
import type { OdysseyDraftSummary } from "../interview/odyssey-draft-summary.types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function coerceSummaryInner(data: unknown): OdysseyDraftSummary | null {
  if (!isRecord(data)) return null;
  const headline = data.headline;
  const summary = data.summary;
  const sections = data.sections;
  const avoidNotes = data.avoidNotes;
  const keywords = data.keywords;
  if (typeof headline !== "string" || typeof summary !== "string") return null;
  if (!Array.isArray(sections) || !Array.isArray(avoidNotes) || !Array.isArray(keywords))
    return null;
  const sec: OdysseyDraftSummary["sections"] = [];
  for (const item of sections) {
    if (!isRecord(item)) return null;
    if (typeof item.title !== "string" || typeof item.description !== "string") return null;
    sec.push({ title: item.title, description: item.description });
  }
  if (sec.length !== 3) return null;
  if (avoidNotes.length < 3 || avoidNotes.length > 5) return null;
  if (keywords.length < 3 || keywords.length > 5) return null;
  for (const n of avoidNotes) {
    if (typeof n !== "string") return null;
  }
  for (const k of keywords) {
    if (typeof k !== "string") return null;
  }
  return {
    headline,
    summary,
    sections: sec,
    avoidNotes: avoidNotes as string[],
    keywords: keywords as string[],
  };
}

function coerceCategoryScores(
  raw: unknown,
): OdysseyAiPlanFormDraft["years"][number]["categoryScores"] | null {
  if (!isRecord(raw)) return null;
  const r = raw.resources;
  const i = raw.interest;
  const c = raw.confidence;
  const h = raw.coherence;
  if (typeof r !== "number" || typeof i !== "number" || typeof c !== "number" || typeof h !== "number")
    return null;
  return { resources: r, interest: i, confidence: c, coherence: h };
}

function coercePlanForm(data: unknown): OdysseyAiPlanFormDraft | null {
  if (!isRecord(data)) return null;
  const title = data.title;
  const years = data.years;
  if (typeof title !== "string" || !Array.isArray(years)) return null;
  if (years.length !== 5) return null;

  const parsed: OdysseyAiPlanFormDraft["years"] = [];
  const seen = new Set<number>();

  for (const item of years) {
    if (!isRecord(item)) return null;
    const yearIndex = item.yearIndex;
    const plans = item.plans;
    const categoryScores = item.categoryScores;
    const keywords = item.keywords;
    const note = item.note;

    if (typeof yearIndex !== "number" || !Number.isInteger(yearIndex)) return null;
    if (yearIndex < 1 || yearIndex > 5) return null;
    if (seen.has(yearIndex)) return null;
    seen.add(yearIndex);

    if (!Array.isArray(plans) || !Array.isArray(keywords)) return null;
    for (const p of plans) {
      if (typeof p !== "string") return null;
    }
    for (const k of keywords) {
      if (typeof k !== "string") return null;
    }

    const cs = coerceCategoryScores(categoryScores);
    if (!cs) return null;

    parsed.push({
      yearIndex,
      plans: plans as string[],
      categoryScores: cs,
      keywords: keywords as string[],
      note: typeof note === "string" ? note : undefined,
    });
  }

  if (seen.size !== 5) return null;

  parsed.sort((a, b) => a.yearIndex - b.yearIndex);
  return { title, years: parsed };
}

export type OdysseyGenerateCoerced = {
  summary: OdysseyDraftSummary;
  planForm: OdysseyAiPlanFormDraft;
};

export function coerceOdysseyGenerateResponse(parsed: unknown): OdysseyGenerateCoerced | null {
  if (!isRecord(parsed)) return null;
  const summary = coerceSummaryInner(parsed.summary);
  const planForm = coercePlanForm(parsed.planForm);
  if (!summary || !planForm) return null;
  return { summary, planForm };
}
