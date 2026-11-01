import { describe, expect, it } from "vitest";

import { fullAnswers, validResponse } from "../lib/__fixtures__/odyssey-generate.fixture";
import { parseInterviewSession } from "../lib/odyssey-interview-session";
import { parsePlanFormAutosave } from "../lib/plan-form-autosave";
import { getYearGoalLines } from "../lib/plan-ai-guidance";
import { createDefaultPlanFormValues } from "../lib/plan.mapper";
import {
  collectActiveOdysseyAnswers,
  findOdysseyFrontierQuestionId,
} from "./odyssey-interview.logic";

describe("findOdysseyFrontierQuestionId", () => {
  it("starts at the first question", () => {
    expect(findOdysseyFrontierQuestionId({})).toBe("q1");
  });

  it("reaches the closing step when everything is answered", () => {
    expect(findOdysseyFrontierQuestionId(fullAnswers())).toBe("q12");
  });

  it("keeps later answers when an edit stays on the same path", () => {
    expect(
      findOdysseyFrontierQuestionId(fullAnswers({ q4: { choiceIds: ["q4_rest"] } })),
    ).toBe("q12");
  });

  it("asks again only where an edit opens a new branch", () => {
    const edited = fullAnswers({ q2: { choiceIds: ["q2_continue"] } });
    expect(findOdysseyFrontierQuestionId(edited)).toBe("q3");

    const reanswered = fullAnswers({
      q2: { choiceIds: ["q2_continue"] },
      q3: { choiceIds: ["q3c_interest"] },
    });
    expect(findOdysseyFrontierQuestionId(reanswered)).toBe("q12");
  });

  it("asks the branch that a changed answer newly opens", () => {
    expect(findOdysseyFrontierQuestionId(fullAnswers({ q6: { choiceIds: ["q6_yes"] } }))).toBe("q7");
    expect(findOdysseyFrontierQuestionId(fullAnswers({ q8: { choiceIds: ["q8_extend"] } }))).toBe("q9");
  });

  it("keeps answers from a closed branch out of what is sent", () => {
    const answers = fullAnswers({ q9: { choiceIds: ["q9_abroad"] } });
    expect(findOdysseyFrontierQuestionId(answers)).toBe("q12");
    expect(collectActiveOdysseyAnswers(answers).q9).toBeUndefined();
  });
});

describe("parseInterviewSession", () => {
  const session = () => ({
    v: 1,
    answers: fullAnswers(),
    currentQuestionId: "q12",
    draft: validResponse(),
  });

  it("restores answers and a paid-for draft after a refresh", () => {
    const restored = parseInterviewSession(JSON.stringify(session()));
    expect(restored?.currentQuestionId).toBe("q12");
    expect(restored?.draft?.planForm.paths).toHaveLength(3);
  });

  it("keeps the answers when a stored draft is corrupted", () => {
    const broken = session();
    broken.draft.planForm.paths = [];
    const restored = parseInterviewSession(JSON.stringify(broken));
    expect(restored?.answers.q1).toBeDefined();
    expect(restored?.draft).toBeNull();
  });

  it("ignores unknown or malformed storage", () => {
    expect(parseInterviewSession("{not json")).toBeNull();
    expect(parseInterviewSession(JSON.stringify({ ...session(), v: 2 }))).toBeNull();
    expect(parseInterviewSession(JSON.stringify({ ...session(), answers: { q1: "x" } }))).toBeNull();
  });
});

describe("older interview sessions", () => {
  it("resumes from the answers when a stored question no longer exists", () => {
    const restored = parseInterviewSession(
      JSON.stringify({ v: 1, answers: fullAnswers(), currentQuestionId: "q_goal", draft: null }),
    );
    expect(restored?.currentQuestionId).toBe("q12");
  });

  it("keeps answers but drops a draft in the old single-plan shape", () => {
    const restored = parseInterviewSession(
      JSON.stringify({
        v: 1,
        answers: fullAnswers(),
        currentQuestionId: "q12",
        draft: { summary: {}, planForm: { title: "x", years: [] } },
      }),
    );
    expect(restored?.answers.q1).toBeDefined();
    expect(restored?.draft).toBeNull();
  });
});

describe("parsePlanFormAutosave", () => {
  it("restores unsaved form values, including unrated scores", () => {
    const values = createDefaultPlanFormValues();
    values.years[0].goals = [{ id: "g1", text: "저장 전 문장" }];

    const restored = parsePlanFormAutosave(JSON.stringify(values));

    expect(restored?.years[0].goals[0].text).toBe("저장 전 문장");
    expect(restored?.years[0].scores.resources).toBeNull();
  });

  it("rejects anything that is not a form", () => {
    expect(parsePlanFormAutosave("{not json")).toBeNull();
    expect(parsePlanFormAutosave(JSON.stringify({ years: [] }))).toBeNull();
    expect(parsePlanFormAutosave(JSON.stringify({ years: ["x"] }))).toBeNull();
  });
});

describe("getYearGoalLines", () => {
  const guidance = {
    sourceGoalTexts: ["목표 문장", "행동 문장"],
    checkpoint: "확인",
    rationale: "근거",
    evidenceQuestionIds: ["q1"],
    pivotCondition: "전환",
  };
  const line = (id: string, text: string) => ({ id, text });

  it("puts the goal first even after lines were reordered", () => {
    const lines = getYearGoalLines(guidance, [line("a", "행동 문장"), line("b", "목표 문장")]);
    expect(lines.map((l) => l.role)).toEqual(["goal", "action"]);
    expect(lines[0].text).toBe("목표 문장");
  });

  it("stops labelling lines once the text was edited", () => {
    const lines = getYearGoalLines(guidance, [line("a", "내가 고친 목표"), line("b", "행동 문장")]);
    expect(lines.map((l) => l.role)).toEqual(["plain", "plain"]);
  });

  it("leaves manual plans unlabelled", () => {
    expect(getYearGoalLines(undefined, [line("a", "직접 쓴 목표")])[0].role).toBe("plain");
  });
});
