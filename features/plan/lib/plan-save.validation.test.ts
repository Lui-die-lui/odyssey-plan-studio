import { describe, expect, it } from "vitest";

import { PLAN_MAX_GOALS_PER_YEAR, PLAN_MAX_LENGTH } from "@/features/plan/constants/plan.constants";
import { parseSavePlanBody } from "./plan-save.validation";

const scores = { resources: 3, interest: 3, confidence: 3, coherence: 3 };

const validBody = () => ({
  title: "  내 플랜  ",
  years: [1, 2, 3, 4, 5].map((yearIndex) => ({
    yearIndex,
    scores,
    goals: yearIndex === 1 ? ["목표"] : [],
    keywords: [],
  })),
});

describe("parseSavePlanBody", () => {
  it("accepts a complete plan and trims the title", () => {
    const result = parseSavePlanBody(validBody());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe("내 플랜");
      expect(result.data.years.map((y) => y.yearIndex)).toEqual([1, 2, 3, 4, 5]);
    }
  });

  it("rejects non-object bodies", () => {
    expect(parseSavePlanBody(null)).toEqual({ ok: false, message: "Invalid JSON body." });
  });

  it("rejects a missing year", () => {
    const body = validBody();
    body.years.pop();
    expect(parseSavePlanBody(body)).toEqual({ ok: false, message: "Missing year 5." });
  });

  it("rejects duplicate and out-of-range year indices", () => {
    const duplicate = validBody();
    duplicate.years[1].yearIndex = 1;
    expect(parseSavePlanBody(duplicate)).toEqual({ ok: false, message: "Duplicate yearIndex." });

    const outOfRange = validBody();
    outOfRange.years[0].yearIndex = 6;
    expect(parseSavePlanBody(outOfRange)).toEqual({ ok: false, message: "yearIndex must be 1–5." });
  });

  it("requires at least one non-blank goal", () => {
    const body = validBody();
    body.years[0].goals = ["   "];
    expect(parseSavePlanBody(body)).toEqual({ ok: false, message: "At least one goal is required." });
  });

  it("enforces goal count and length limits", () => {
    const tooMany = validBody();
    tooMany.years[0].goals = Array(PLAN_MAX_GOALS_PER_YEAR + 1).fill("목표");
    expect(parseSavePlanBody(tooMany).ok).toBe(false);

    const tooLong = validBody();
    tooLong.years[0].goals = ["가".repeat(PLAN_MAX_LENGTH.goal + 1)];
    expect(parseSavePlanBody(tooLong).ok).toBe(false);
  });

  it("clamps scores into the allowed range", () => {
    const body = validBody();
    body.years[0].scores = { resources: 99, interest: -3, confidence: 2.6, coherence: 3 };
    const result = parseSavePlanBody(body);
    expect(result.ok && result.data.years[0].scores).toEqual({
      resources: 5,
      interest: 1,
      confidence: 3,
      coherence: 3,
    });
  });
});
