import { describe, expect, it } from "vitest";

import {
  PLAN_PREPARATION_CATALOG,
  findPreparationCatalogEntry,
} from "../constants/plan-preparation.constants";
import { ODYSSEY_OTHER_CHOICE_ID } from "../interview/odyssey-interview.types";
import {
  answeredIds,
  fullAnswers,
  validResponse,
} from "./__fixtures__/odyssey-generate.fixture";
import { validateOdysseyGenerateResponse } from "./odyssey-generate-response.validation";
import {
  buildPreparationContext,
  validatePreparation,
  type OdysseyPreparationContext,
} from "./odyssey-preparation.validation";

const study = {
  catalogId: "",
  title: "돌봄 현장 관찰 기록하기",
  kind: "practice",
  priority: "start_first",
  reason: "1년차 행동을 시작하려면 현장을 먼저 봐야 합니다.",
  evidence: { questionIds: ["q1"], explanation: "지금 하는 일을 답했습니다." },
  checkpoint: "현장의 하루를 설명할 수 있습니다.",
  conditions: "",
  alternative: "",
};

const credential = {
  ...study,
  catalogId: "kr-care-worker",
  title: "모델이 지은 이름",
  kind: "credential",
  priority: "after_basics",
  reason: "돌봄 일을 하려면 관련 조건을 확인해야 합니다.",
  alternative: "먼저 봉사 활동으로 현장을 경험합니다.",
};

const context = (overrides: Partial<OdysseyPreparationContext> = {}) => ({
  answerText: "",
  heldText: "",
  lowOnTime: false,
  outsideKorea: false,
  unsurePaths: [],
  ...overrides,
});

const check = (raw: unknown, overrides: Partial<OdysseyPreparationContext> = {}, planText = "돌봄 일을 경험합니다") =>
  validatePreparation(raw, {
    prefix: "",
    isKnownId: (id) => id === "q1",
    context: context(overrides),
    planText,
    pathKind: "alternative",
  });

const reason = (result: ReturnType<typeof check>) => (result.ok ? null : result.reason);

describe("catalog", () => {
  it("only lists entries with a source and a check date", () => {
    for (const entry of PLAN_PREPARATION_CATALOG) {
      expect(entry.sourceUrl).toMatch(/^https:\/\/www\.law\.go\.kr\//);
      expect(entry.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.keywords.length).toBeGreaterThan(0);
    }
  });
});

describe("validatePreparation", () => {
  it("accepts general study or practice as a plain suggestion", () => {
    const result = check(study);
    expect(result.ok && result.value.catalogId).toBeNull();
  });

  it("uses the catalog name, not the model's", () => {
    const result = check(credential);
    expect(result.ok && result.value.title).toBe("요양보호사");
  });

  it("stores no URL or requirement from the model", () => {
    const result = check({ ...credential, sourceUrl: "https://made.up" });
    expect(result.ok && JSON.stringify(result.value)).not.toContain("made.up");
  });

  it("rejects an invented catalog ID", () => {
    expect(reason(check({ ...credential, catalogId: "kr-invented" }))).toBe(
      "preparation_unknown_catalog",
    );
  });

  it("rejects credentials outside the catalog", () => {
    expect(reason(check({ ...study, kind: "credential" }))).toBe("preparation_unlisted_credential");
    expect(reason(check({ ...study, title: "도시농업 자격증 취득" }))).toBe(
      "preparation_unlisted_credential",
    );
    expect(reason(check({ ...study, title: "정보처리기사 시험 준비" }))).toBe(
      "preparation_unlisted_credential",
    );
  });

  it("allows a topic that only sounds like a credential", () => {
    expect(check({ ...study, title: "신문 기사 쓰기 연습" }).ok).toBe(true);
  });

  it("rejects links written by the model", () => {
    expect(reason(check({ ...study, conditions: "https://example.com 참고" }))).toBe(
      "preparation_link",
    );
  });

  it("rejects a requirement claim without a source", () => {
    expect(reason(check({ ...study, reason: "이 분야는 교육 이수가 필수입니다." }))).toBe(
      "preparation_unsourced_required",
    );
    const socialWorker = { ...credential, catalogId: "kr-social-worker", reason: "취업에 필수입니다." };
    expect(reason(check(socialWorker, {}, "복지관에서 일합니다"))).toBe(
      "preparation_unsourced_required",
    );
  });

  it("does not recommend what the user already holds", () => {
    expect(reason(check(credential, { heldText: "요양보호사 자격이 있어요" }))).toBe(
      "preparation_already_held",
    );
  });

  it("rejects a credential unrelated to the path", () => {
    expect(reason(check(credential, {}, "도시를 옮겨 다니며 그림을 그립니다"))).toBe(
      "preparation_unrelated",
    );
  });

  it("does not apply Korean rules to someone planning to live abroad", () => {
    expect(reason(check(credential, { outsideKorea: true }))).toBe("preparation_region");
  });

  it("rejects starting a credential first with very little time", () => {
    const first = { ...credential, priority: "start_first" };
    expect(reason(check(first, { lowOnTime: true }))).toBe("preparation_exceeds_time");
    expect(check(credential, { lowOnTime: true }).ok).toBe(true);
  });

  it("puts exploring before exams when the path is unclear", () => {
    const first = { ...credential, priority: "start_first" };
    expect(reason(check(first, { unsurePaths: ["alternative"] }))).toBe("preparation_too_early");
  });

  it("rejects evidence for answers that were not given", () => {
    const raw = { ...study, evidence: { questionIds: ["q9"], explanation: "근거" } };
    expect(reason(check(raw))).toBe("preparation_evidence");
  });
});

describe("response limits", () => {
  const item = { ...study, evidence: { questionIds: ["q1"], explanation: "근거" } };

  it("needs no preparation at all", () => {
    expect(validateOdysseyGenerateResponse(validResponse(), answeredIds).ok).toBe(true);
  });

  it("caps a path at three items, counting shared ones", () => {
    const response = validResponse() as ReturnType<typeof validResponse>;
    response.planForm.sharedPreparations = [{ ...item, title: "공통" }] as never;
    response.planForm.paths[0]!.preparations = [
      { ...item, title: "하나" },
      { ...item, title: "둘" },
      { ...item, title: "셋" },
    ] as never;
    expect(validateOdysseyGenerateResponse(response, answeredIds)).toEqual({
      ok: false,
      reason: "continue_preparation_count",
    });
  });
});

describe("buildPreparationContext", () => {
  it("reads held credentials, time and region from real answers", () => {
    const result = buildPreparationContext(
      fullAnswers({
        q_assets: { choiceIds: [ODYSSEY_OTHER_CHOICE_ID], text: "요양보호사 자격 보유" },
        q_time: { choiceIds: ["q_time_low"] },
        q_limits: { choiceIds: ["q_limits_abroad"] },
        q_path_b: { choiceIds: ["q_path_b_unknown"] },
      }),
    );
    expect(result).toMatchObject({
      heldText: "요양보호사 자격 보유",
      lowOnTime: true,
      outsideKorea: true,
      unsurePaths: ["alternative"],
    });
  });

  it("resolves catalog IDs in code", () => {
    expect(findPreparationCatalogEntry("kr-care-worker")?.requirement).toBe("required");
    expect(findPreparationCatalogEntry(null)).toBeUndefined();
  });
});
