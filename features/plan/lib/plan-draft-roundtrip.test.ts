import { describe, expect, it } from "vitest";

import type { SavedPlanResponse } from "../types/plan.types";
import { validResponse, validYear } from "./__fixtures__/odyssey-generate.fixture";
import { mapOdysseyAiPlanFormToPlanFormValues } from "./odyssey-ai-plan-draft.mapper";
import {
  parseLegacyStoredDraft,
  parseStoredDraft,
  parseStoredPathsDraft,
} from "./odyssey-ai-draft-session";
import { describeEvidenceQuestions, isAiGuidanceOutdated } from "./plan-ai-guidance";
import { mapYearPayloadToCreateData, mapYearToDto } from "./plan-db.server";
import { parseSavePlanBody } from "./plan-save.validation";
import {
  createDefaultPlanFormValues,
  mapPlanFormValuesToSavePayload,
  mapSavedPlanResponseToForm,
} from "./plan.mapper";
import { validatePlanForm } from "./plan.validation";

const draft = () => ({ title: "병행 계획", years: [1, 2, 3, 4, 5].map((y) => validYear(y)) });
const unratedScores = { resources: null, interest: null, confidence: null, coherence: null };

describe("AI draft to form", () => {
  it("makes goal and actions editable lines and keeps guidance separately", () => {
    const form = mapOdysseyAiPlanFormToPlanFormValues(draft());
    const [first] = form.years;

    expect(first.goals.map((g) => g.text)).toEqual([draft().years[0].goal, ...draft().years[0].actions]);
    expect(first.note).toBe("");
    expect(first.aiGuidance).toEqual({
      sourceGoalTexts: first.goals.map((g) => g.text),
      checkpoint: draft().years[0].checkpoint,
      rationale: draft().years[0].evidence.explanation,
      evidenceQuestionIds: ["q_path_a", "q_time"],
      pivotCondition: draft().years[0].pivotCondition,
    });
  });

  it("starts unrated rather than filling a default score", () => {
    const form = mapOdysseyAiPlanFormToPlanFormValues(draft());
    expect(form.years.every((y) => y.scores.resources === null)).toBe(true);
    expect(form.years[0].scores).toEqual(unratedScores);
    expect(form.years[0].unverifiedScoreKeys).toEqual([]);
  });
});

describe("sessionStorage drafts", () => {
  it("restores the three-path format", () => {
    const planForm = validResponse().planForm;
    expect(parseStoredPathsDraft(JSON.stringify({ v: 3, planForm }))?.paths).toHaveLength(3);
    expect(parseStoredPathsDraft(JSON.stringify({ v: 2, planForm }))).toBeNull();
  });

  it("restores the current format with guidance", () => {
    const restored = parseStoredDraft(JSON.stringify({ v: 2, planForm: draft() }));
    expect(restored?.years[2].aiGuidance?.pivotCondition).toBe(draft().years[2].pivotCondition);
  });

  it("rejects a corrupted current-format draft", () => {
    const planForm = draft();
    planForm.years[0].actions = [];
    expect(parseStoredDraft(JSON.stringify({ v: 2, planForm }))).toBeNull();
    expect(parseStoredDraft("{not json")).toBeNull();
    expect(parseStoredDraft(JSON.stringify({ v: 1, planForm: draft() }))).toBeNull();
  });

  it("keeps v1 text but drops the AI-made scores", () => {
    const restored = parseLegacyStoredDraft(
      JSON.stringify({
        v: 1,
        planForm: {
          title: "이전 초안",
          years: [
            {
              yearIndex: 1,
              plans: ["이전 목표"],
              categoryScores: { resources: 4, interest: 4, confidence: 4, coherence: 3 },
              keywords: ["기록"],
              note: "이전 메모",
            },
          ],
        },
      }),
    );

    expect(restored?.title).toBe("이전 초안");
    expect(restored?.years[0].goals.map((g) => g.text)).toEqual(["이전 목표"]);
    expect(restored?.years[0].note).toBe("이전 메모");
    expect(restored?.years[0].scores).toEqual(unratedScores);
    expect(restored?.years[0].aiGuidance).toBeUndefined();
    expect(restored?.years).toHaveLength(5);
  });

  it("rejects malformed v1 drafts", () => {
    const bad = { v: 1, planForm: { title: "x", years: [{ yearIndex: 9, plans: [], keywords: [] }] } };
    expect(parseLegacyStoredDraft(JSON.stringify(bad))).toBeNull();
    expect(parseLegacyStoredDraft(JSON.stringify({ v: 1 }))).toBeNull();
  });
});

describe("save validation", () => {
  const body = () =>
    JSON.parse(
      JSON.stringify(mapPlanFormValuesToSavePayload(mapOdysseyAiPlanFormToPlanFormValues(draft()))),
    );

  it("keeps null as unrated and 1 as a rating", () => {
    const input = body();
    input.years[0].scores = { resources: 1, interest: null, confidence: null, coherence: null };
    const result = parseSavePlanBody(input);
    expect(result.ok && result.data.years?.[0].scores).toEqual({
      resources: 1,
      interest: null,
      confidence: null,
      coherence: null,
    });
  });

  it("rejects scores that are not numbers", () => {
    const input = body();
    input.years[0].scores.resources = "높음";
    expect(parseSavePlanBody(input)).toEqual({ ok: false, message: "Invalid scores for year 1." });
  });

  it("carries guidance through unchanged", () => {
    const result = parseSavePlanBody(body());
    expect(result.ok && result.data.years?.[1].aiGuidance?.evidenceQuestionIds).toEqual([
      "q_path_a",
      "q_time",
    ]);
  });

  it("rejects malformed guidance instead of storing part of it", () => {
    const input = body();
    input.years[0].aiGuidance.checkpoint = "";
    expect(parseSavePlanBody(input)).toEqual({ ok: false, message: "Invalid AI guidance for year 1." });
  });

  it("accepts a plan with no AI fields, like a manual or older client", () => {
    const input = body();
    for (const y of input.years) {
      delete y.aiGuidance;
      delete y.unverifiedScoreKeys;
    }
    const result = parseSavePlanBody(input);
    expect(result.ok && result.data.years?.[0].aiGuidance).toBeUndefined();
    expect(result.ok && result.data.years?.[0].unverifiedScoreKeys).toEqual([]);
  });

  it("does not keep an unverified flag on a score that is now empty", () => {
    const input = body();
    input.years[0].unverifiedScoreKeys = ["resources"];
    const result = parseSavePlanBody(input);
    expect(result.ok && result.data.years?.[0].unverifiedScoreKeys).toEqual([]);
  });
});

describe("manual form", () => {
  it("starts unrated and saves without any score", () => {
    const values = createDefaultPlanFormValues();
    values.years[0].goals = [{ id: "g1", text: "직접 쓴 목표" }];

    expect(values.years[0].scores).toEqual(unratedScores);
    expect(validatePlanForm(values).isValid).toBe(true);
    expect(mapPlanFormValuesToSavePayload(values).years[0].aiGuidance).toBeUndefined();
  });
});

describe("saved plan read back", () => {
  const dbYear = {
    id: "year1",
    yearIndex: 1,
    note: null,
    resourcesScore: 4,
    interestScore: 4,
    confidenceScore: 4,
    coherenceScore: 3,
    unverifiedScoreKeys: ["resources", "interest", "confidence", "coherence"],
    aiGuidance: null,
    goals: [{ id: "g1", position: 0, text: "기존 목표" }],
    keywords: [],
  };

  const asResponse = (dto: ReturnType<typeof mapYearToDto>): SavedPlanResponse => ({
    planId: "p1",
    years: [dto],
    paths: [],
  });

  it("keeps existing scores and their unverified flag through an edit save", () => {
    const form = mapSavedPlanResponseToForm(asResponse(mapYearToDto(dbYear)));
    const payload = mapPlanFormValuesToSavePayload(form);

    expect(payload.years[0].scores.coherence).toBe(3);
    expect(payload.years[0].unverifiedScoreKeys).toEqual([
      "resources",
      "interest",
      "confidence",
      "coherence",
    ]);
    expect(payload.years[0].aiGuidance).toBeUndefined();
  });

  it("maps null columns to unrated", () => {
    const dto = mapYearToDto({
      ...dbYear,
      resourcesScore: null,
      interestScore: null,
      confidenceScore: null,
      coherenceScore: null,
      unverifiedScoreKeys: [],
    });
    expect(dto.scores).toEqual(unratedScores);
  });

  it("builds a create payload with guidance only when it exists", () => {
    const form = mapOdysseyAiPlanFormToPlanFormValues(draft());
    const [withGuidance] = mapPlanFormValuesToSavePayload(form).years;
    expect(mapYearPayloadToCreateData(withGuidance)).toMatchObject({
      resourcesScore: null,
      aiGuidance: { create: withGuidance.aiGuidance },
    });
    expect(
      mapYearPayloadToCreateData({ ...withGuidance, aiGuidance: undefined }),
    ).not.toHaveProperty("aiGuidance");
  });
});

describe("edited AI goals", () => {
  const guidance = mapOdysseyAiPlanFormToPlanFormValues(draft()).years[0].aiGuidance!;
  const source = guidance.sourceGoalTexts;

  it("stays current when goals are unchanged or only reordered", () => {
    expect(isAiGuidanceOutdated(guidance, source)).toBe(false);
    expect(isAiGuidanceOutdated(guidance, [...source].reverse())).toBe(false);
  });

  it("turns outdated when goal text changes, is added, or is removed", () => {
    expect(isAiGuidanceOutdated(guidance, [`${source[0]} 수정`, ...source.slice(1)])).toBe(true);
    expect(isAiGuidanceOutdated(guidance, [...source, "새 목표"])).toBe(true);
    expect(isAiGuidanceOutdated(guidance, source.slice(0, 1))).toBe(true);
  });
});

describe("describeEvidenceQuestions", () => {
  it("shows prompts and skips IDs no longer in the flow", () => {
    const prompts = describeEvidenceQuestions(["q_time", "q_removed"]);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain("일주일");
  });
});
