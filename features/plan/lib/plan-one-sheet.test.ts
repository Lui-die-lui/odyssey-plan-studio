import { describe, expect, it } from "vitest";

import type { PlanPathDto, PlanPreparation, PlanYearDto, SavedPlanResponse } from "../types/plan.types";
import { NO_CREDENTIAL_FALLBACK, buildOneSheet, condenseText } from "./plan-one-sheet";

const unrated = { resources: null, interest: null, confidence: null, coherence: null };

const year = (yearIndex: PlanYearDto["yearIndex"], goals: string[], extra: Partial<PlanYearDto> = {}): PlanYearDto => ({
  id: `y${yearIndex}`,
  yearIndex,
  scores: unrated,
  unverifiedScoreKeys: [],
  goals: goals.map((text, position) => ({ id: `g${position}`, position, text })),
  keywords: [],
  ...extra,
});

const preparation = (overrides: Partial<PlanPreparation>): PlanPreparation => ({
  catalogId: null,
  title: "LLM API 연동",
  kind: "study",
  priority: "start_first",
  reason: "1년차 작업물에 필요합니다.",
  brief: "작은 챗봇 만들기",
  basis: "",
  evidenceQuestionIds: [],
  checkpoint: "",
  conditions: "",
  alternative: "",
  ...overrides,
});

const path = (overrides: Partial<PlanPathDto> = {}): PlanPathDto => ({
  id: "p1",
  kind: "continue",
  title: "지금 일 넓히기",
  tagline: "",
  overview: "일의 범위를 넓히는 5년입니다. 절반은 새 업무에 씁니다.",
  appeal: "",
  appealQuestionIds: [],
  requirements: [],
  openQuestions: [],
  experiments: [],
  preparations: [],
  credentialNote: "",
  scores: unrated,
  marks: [],
  years: [year(1, ["목표", "행동"]), year(2, []), year(3, []), year(4, []), year(5, [])],
  ...overrides,
});

const plan = (overrides: Partial<SavedPlanResponse> = {}): SavedPlanResponse => ({
  planId: "plan",
  years: [],
  paths: [path()],
  sharedPreparations: [],
  ...overrides,
});

describe("condenseText", () => {
  it("leaves short text alone", () => {
    expect(condenseText("짧은 문장입니다.", 30)).toBe("짧은 문장입니다.");
  });

  it("prefers a whole first sentence", () => {
    expect(condenseText("첫 문장입니다. 뒤에 아주 긴 설명이 이어집니다 정말 길게 이어집니다.", 12)).toBe(
      "첫 문장입니다",
    );
  });

  it("stops at a clause boundary", () => {
    expect(condenseText("주 3시간 안에서 작업물을 만들고, 관련 일을 하는 사람에게 피드백을 받습니다", 20)).toBe(
      "주 3시간 안에서 작업물을 만들고",
    );
  });

  it("marks a forced cut and keeps whole words", () => {
    const result = condenseText("가나다라 마바사아 자차카타 파하가나 다라마바 사아자차", 16);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(17);
    expect(result).not.toContain("  ");
  });
});

describe("buildOneSheet", () => {
  it("shows all five years for every path", () => {
    expect(buildOneSheet(plan()).columns[0]!.years).toHaveLength(5);
  });

  it("uses the generated brief while the goal is unedited", () => {
    const guidance = {
      sourceGoalTexts: ["긴 원문 목표", "긴 원문 행동"],
      briefGoal: "짧은 목표",
      briefAction: "짧은 행동",
      checkpoint: "c",
      rationale: "r",
      evidenceQuestionIds: ["q1"],
      pivotCondition: "p",
    };
    const unedited = year(1, ["긴 원문 목표", "긴 원문 행동"], { aiGuidance: guidance });
    const edited = year(1, ["내가 고친 목표", "긴 원문 행동"], { aiGuidance: guidance });

    expect(buildOneSheet(plan({ paths: [path({ years: [unedited] })] })).columns[0]!.years[0]).toEqual({
      goal: "짧은 목표",
      action: "짧은 행동",
    });
    expect(buildOneSheet(plan({ paths: [path({ years: [edited] })] })).columns[0]!.years[0]!.goal).toBe(
      "내가 고친 목표",
    );
  });

  it("works for data saved before briefs existed", () => {
    const old = year(1, ["첫 문장입니다. ".concat("긴 설명 ".repeat(30))]);
    const cell = buildOneSheet(plan({ paths: [path({ years: [old] })] })).columns[0]!.years[0]!;
    expect(cell.goal).toBe("첫 문장입니다");
  });

  it("does not change the saved plan", () => {
    const original = plan();
    const snapshot = JSON.stringify(original);
    buildOneSheet(original);
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it("lists at most two studies, topic first", () => {
    const items = [1, 2, 3].map((n) => preparation({ title: `주제 ${n}` }));
    const { studies } = buildOneSheet(plan({ paths: [path({ preparations: items })] })).columns[0]!;
    expect(studies).toEqual([
      { title: "주제 1", purpose: "작은 챗봇 만들기" },
      { title: "주제 2", purpose: "작은 챗봇 만들기" },
    ]);
  });

  it("includes shared preparation in each path", () => {
    const sheet = buildOneSheet(plan({ sharedPreparations: [preparation({ title: "공통 주제" })] }));
    expect(sheet.columns[0]!.studies[0]!.title).toBe("공통 주제");
  });

  it("shows a verified credential with its catalog name and status", () => {
    const item = preparation({ catalogId: "kr-care-worker", kind: "credential", title: "다른 이름" });
    const { credential } = buildOneSheet(plan({ paths: [path({ preparations: [item] })] })).columns[0]!;
    expect(credential).toMatchObject({ name: "요양보호사", status: "법령상 자격 필요 (대한민국)" });
  });

  it("explains why no credential is listed", () => {
    const withNote = path({ credentialNote: "자격증보다 작품 실습 우선" });
    expect(buildOneSheet(plan({ paths: [withNote] })).columns[0]!.credentialNote).toBe(
      "자격증보다 작품 실습 우선",
    );
    expect(buildOneSheet(plan()).columns[0]!.credentialNote).toBe(NO_CREDENTIAL_FALLBACK);
  });

  it("prefers the experiment the user chose", () => {
    const experiments = [
      { action: "첫 실험", learning: "x", nextUp: false },
      { action: "고른 실험", learning: "x", nextUp: true },
    ];
    expect(buildOneSheet(plan({ paths: [path({ experiments })] })).columns[0]!.firstStep).toBe("고른 실험");
  });

  it("keeps unrated short and real ratings visible", () => {
    expect(buildOneSheet(plan()).columns[0]!.rating).toBe("자기평가 전");
    const rated = path({ scores: { ...unrated, resources: 1 } });
    expect(buildOneSheet(plan({ paths: [rated] })).columns[0]!.rating).toBe("자기평가 여건 1");
  });

  it("keeps very long saved text within what one page can hold", () => {
    const long = "가".repeat(200);
    const sheet = buildOneSheet(
      plan({
        title: long,
        paths: [
          path({
            title: long,
            tagline: long,
            preparations: [preparation({ title: long, brief: long })],
            years: [year(1, [long, long])],
          }),
        ],
      }),
    );
    const column = sheet.columns[0]!;
    expect(sheet.title.length).toBeLessThanOrEqual(47);
    expect(column.title.length).toBeLessThanOrEqual(41);
    expect(column.tagline.length).toBeLessThanOrEqual(57);
    expect(column.studies[0]!.title.length).toBeLessThanOrEqual(21);
    expect(column.years[0]!.goal.length).toBeLessThanOrEqual(43);
  });

  it("gives an older single plan one column of its own", () => {
    const sheet = buildOneSheet(plan({ paths: [], title: "기존", years: [year(1, ["기존 목표"])] }));
    expect(sheet.columns.map((c) => c.key)).toEqual(["legacy"]);
    expect(sheet.columns[0]!.years[0]!.goal).toBe("기존 목표");
  });

  it("leaves an older single plan out of a three-path sheet", () => {
    const sheet = buildOneSheet(plan({ years: [year(1, ["기존 목표"])] }));
    expect(sheet.hasLegacyPlan).toBe(true);
    expect(JSON.stringify(sheet.columns)).not.toContain("기존 목표");
  });
});
