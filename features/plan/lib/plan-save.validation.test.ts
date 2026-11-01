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

describe("parseSavePlanBody with paths", () => {
  const path = (kind: string) => ({
    kind,
    title: "경로",
    overview: "",
    appeal: "",
    appealQuestionIds: [],
    requirements: [],
    openQuestions: [],
    experiments: [],
    scores: { resources: null, interest: null, confidence: null, coherence: null },
    marks: [],
    years: validBody().years,
  });
  const paths = () => ["continue", "alternative", "unbound"].map(path);

  it("accepts three paths with no single plan", () => {
    const result = parseSavePlanBody({ paths: paths() });
    expect(result.ok && result.data.years).toBeUndefined();
    expect(result.ok && result.data.paths).toHaveLength(3);
  });

  it("keeps a whole-path rating separate and unrated by default", () => {
    const body = paths();
    body[0]!.scores.resources = 1 as never;
    const result = parseSavePlanBody({ paths: body });
    expect(result.ok && result.data.paths?.[0]?.scores.resources).toBe(1);
    expect(result.ok && result.data.paths?.[1]?.scores.resources).toBeNull();
  });

  it("rejects missing or repeated paths", () => {
    expect(parseSavePlanBody({ paths: paths().slice(0, 2) }).ok).toBe(false);
    expect(parseSavePlanBody({ paths: ["continue", "continue", "unbound"].map(path) }).ok).toBe(false);
    expect(parseSavePlanBody({ paths: ["continue", "alternative", "x"].map(path) }).ok).toBe(false);
  });

  it("rejects an experiment that lacks what it tests", () => {
    const body = paths();
    body[0]!.experiments = [{ action: "대화하기", learning: "" }] as never;
    expect(parseSavePlanBody({ paths: body }).ok).toBe(false);
  });

  it("rejects unknown marks", () => {
    const body = paths();
    body[0]!.marks = ["best"] as never;
    expect(parseSavePlanBody({ paths: body }).ok).toBe(false);
  });

  it("requires a goal somewhere across the paths", () => {
    const body = paths().map((p) => ({
      ...p,
      years: p.years.map((y) => ({ ...y, goals: [] })),
    }));
    expect(parseSavePlanBody({ paths: body })).toEqual({
      ok: false,
      message: "At least one goal is required.",
    });
  });
});

describe("parseSavePlanBody", () => {
  it("accepts a complete plan and trims the title", () => {
    const result = parseSavePlanBody(validBody());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe("내 플랜");
      expect(result.data.years?.map((y) => y.yearIndex)).toEqual([1, 2, 3, 4, 5]);
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
    expect(result.ok && result.data.years?.[0].scores).toEqual({
      resources: 5,
      interest: 1,
      confidence: 3,
      coherence: 3,
    });
  });
});
