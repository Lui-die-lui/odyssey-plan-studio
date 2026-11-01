import { describe, expect, it } from "vitest";

import {
  answeredIds,
  validPath,
  validResponse,
  validYear,
} from "./__fixtures__/odyssey-generate.fixture";
import {
  measurePathSimilarity,
  validateOdysseyGenerateResponse,
} from "./odyssey-generate-response.validation";
import { ODYSSEY_GENERATE_RESPONSE_SCHEMA } from "./odyssey-generate.schema";

const year = (r: ReturnType<typeof validResponse>, index: number) =>
  r.planForm.paths[0]!.years[index]!;

const validate = (response: unknown) =>
  validateOdysseyGenerateResponse(response, answeredIds);

const reasonFor = (mutate: (r: ReturnType<typeof validResponse>) => void) => {
  const response = validResponse();
  mutate(response);
  const result = validate(response);
  return result.ok ? null : result.reason;
};

describe("validateOdysseyGenerateResponse", () => {
  it("accepts a complete response", () => {
    expect(validate(validResponse()).ok).toBe(true);
  });

  it("sorts years without changing their content", () => {
    const response = validResponse();
    response.planForm.paths.reverse();
    response.planForm.paths[0]!.years.reverse();
    const result = validate(response);
    expect(result.ok && result.value.planForm.paths.map((p) => p.kind)).toEqual([
      "continue",
      "alternative",
      "unbound",
    ]);
    expect(result.ok && result.value.planForm.paths[2]!.years[0]!.yearIndex).toBe(1);
  });

  it("allows only as many avoid notes and keywords as were found", () => {
    const result = validate(validResponse());
    expect(result.ok && result.value.summary.avoidNotes).toEqual([]);
    expect(result.ok && result.value.summary.keywords).toEqual([]);
  });

  it("rejects non-objects and missing sections", () => {
    expect(validate(null)).toEqual({ ok: false, reason: "root_shape" });
    expect(validate({ summary: {} })).toMatchObject({ ok: false });
  });

  it("rejects evidence IDs that were not submitted", () => {
    expect(
      reasonFor((r) => {
        year(r, 2).evidence.questionIds = ["q9"];
      }),
    ).toBe("continue_year3_evidence_ids");
    expect(
      reasonFor((r) => {
        r.summary.facts[0].questionIds = ["q_made_up"];
      }),
    ).toBe("facts_evidence");
  });

  it("rejects missing and duplicated years", () => {
    expect(reasonFor((r) => void r.planForm.paths[0]!.years.pop())).toBe("continue_plan_year_count");
    expect(
      reasonFor((r) => {
        r.planForm.paths[0]!.years[4] = { ...validYear(1), actions: ["겹치지 않는 행동을 하나 적습니다."] };
      }),
    ).toBe("continue_plan_year_duplicate");
    expect(
      reasonFor((r) => {
        year(r, 4).yearIndex = 6;
      }),
    ).toBe("continue_year_index");
  });

  it("fails instead of trimming values that exceed form limits", () => {
    expect(
      reasonFor((r) => {
        year(r, 0).goal = "가".repeat(201);
      }),
    ).toBe("continue_year1_goal");
    expect(
      reasonFor((r) => {
        year(r, 0).keywords = ["여덟글자키워드임"];
      }),
    ).toBe("continue_year1_keywords");
  });

  it("requires one or two actions", () => {
    expect(
      reasonFor((r) => {
        year(r, 0).actions = [];
      }),
    ).toBe("continue_year1_actions");
    expect(
      reasonFor((r) => {
        year(r, 0).actions = ["행동 하나를 합니다.", "행동 둘을 합니다.", "행동 셋을 합니다."];
      }),
    ).toBe("continue_year1_actions");
  });

  it("rejects empty guidance fields", () => {
    expect(
      reasonFor((r) => {
        year(r, 1).checkpoint = "  ";
      }),
    ).toBe("continue_year2_checkpoint");
    expect(
      reasonFor((r) => {
        year(r, 1).pivotCondition = "";
      }),
    ).toBe("continue_year2_pivot");
  });

  it("rejects actions that stop at a vague phrase", () => {
    expect(
      reasonFor((r) => {
        year(r, 0).actions = ["역량 강화"];
      }),
    ).toBe("continue_year1_vague");
    expect(
      reasonFor((r) => {
        year(r, 0).actions = ["균형을 유지합니다."];
      }),
    ).toBe("continue_year1_vague");
  });

  it("accepts a concrete action that mentions the same words", () => {
    expect(
      reasonFor((r) => {
        year(r, 0).actions = [
          "주 3시간 안에서 포트폴리오 작품 2개를 만들고 동료 1명에게 역량 강화에 도움이 되었는지 묻습니다.",
        ];
      }),
    ).toBeNull();
  });

  it("rejects the same action repeated across years", () => {
    expect(
      reasonFor((r) => {
        year(r, 3).actions = [...year(r, 0).actions];
      }),
    ).toBe("continue_plan_action_repeated");
  });
});

describe("three paths", () => {
  it("requires each path exactly once", () => {
    expect(reasonFor((r) => void r.planForm.paths.pop())).toBe("plan_path_count");
    expect(
      reasonFor((r) => {
        r.planForm.paths[2] = validPath("continue");
      }),
    ).toBe("plan_path_duplicate");
  });

  it("rejects paths that are the same plan in different words", () => {
    expect(
      reasonFor((r) => {
        r.planForm.paths[1] = { ...validPath("continue"), kind: "alternative" };
      }),
    ).toBe("paths_too_similar");
  });

  it("measures really different paths as different", () => {
    const [a, b] = validResponse().planForm.paths;
    expect(measurePathSimilarity(a!, b!)).toBeLessThan(0.7);
  });

  it("rejects a big decision as the first experiment", () => {
    expect(
      reasonFor((r) => {
        r.planForm.paths[2]!.experiments[0]!.action = "다음 달에 퇴사를 합니다.";
      }),
    ).toBe("unbound_experiment_big_decision");
  });

  it("allows talking to someone who made that decision", () => {
    expect(
      reasonFor((r) => {
        r.planForm.paths[2]!.experiments[0]!.action = "퇴사한 사람에게 지금 생활을 물어봅니다.";
      }),
    ).toBeNull();
  });

  it("requires experiments to say what they test", () => {
    expect(
      reasonFor((r) => {
        r.planForm.paths[0]!.experiments[0]!.learning = "";
      }),
    ).toBe("continue_experiment_text");
  });

  it("requires appeal evidence from submitted answers", () => {
    expect(
      reasonFor((r) => {
        r.planForm.paths[1]!.appeal.questionIds = ["q9"];
      }),
    ).toBe("alternative_appeal");
  });
});

describe("ODYSSEY_GENERATE_RESPONSE_SCHEMA", () => {
  const properties = ODYSSEY_GENERATE_RESPONSE_SCHEMA.properties as Record<
    string,
    { properties: Record<string, { minItems?: number; properties?: Record<string, unknown> }> }
  >;

  it("does not force avoid notes or keywords to be invented", () => {
    expect(properties.summary.properties.avoidNotes.minItems).toBe(0);
    expect(properties.summary.properties.keywords.minItems).toBe(0);
  });

  it("no longer asks the model for scores", () => {
    expect(JSON.stringify(ODYSSEY_GENERATE_RESPONSE_SCHEMA)).not.toContain("categoryScores");
  });
});
