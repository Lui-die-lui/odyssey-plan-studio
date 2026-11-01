import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fullAnswers,
  validResponse,
} from "@/features/plan/lib/__fixtures__/odyssey-generate.fixture";

const mocks = vi.hoisted(() => ({
  createResponse: vi.fn(),
  getUser: vi.fn(),
  consume: vi.fn(),
  refund: vi.fn(),
  log: vi.fn(),
  config: vi.fn(),
  userState: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class {
    responses = { create: mocks.createResponse };
  },
}));
vi.mock("@/features/auth/lib/session-user", () => ({
  getActiveSessionUser: mocks.getUser,
}));
vi.mock("@/features/plan/lib/ai-draft-quota", () => ({
  MONTHLY_AI_DRAFT_LIMIT: 2,
  consumeAiDraftQuota: mocks.consume,
  getAiDraftMonthKey: () => "2026-11",
  refundAiDraftQuota: mocks.refund,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    aiRequestLog: { create: mocks.log },
    systemConfig: { findUnique: mocks.config },
    user: { findUnique: mocks.userState },
  },
}));

import { POST } from "./route";

const request = (answers: unknown = fullAnswers()) =>
  new Request("https://example.com/api/odyssey/generate", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

const loggedReason = () => mocks.log.mock.calls.at(-1)?.[0].data;

describe("POST /api/odyssey/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getUser.mockResolvedValue({ id: "user1", role: "USER" });
    mocks.config.mockResolvedValue(null);
    mocks.userState.mockResolvedValue({ aiBlocked: false });
    mocks.consume.mockResolvedValue({ allowed: true, remaining: 1 });
    mocks.log.mockResolvedValue({});
    mocks.createResponse.mockResolvedValue({
      output_text: JSON.stringify(validResponse()),
    });
  });

  it("returns a validated draft without refunding", async () => {
    const res = await POST(request());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.remaining).toBe(1);
    expect(body.planForm.paths).toHaveLength(3);
    expect(mocks.refund).not.toHaveBeenCalled();
    expect(loggedReason()).toMatchObject({ success: true });
  });

  it("calls the model once with store off and answers as data", async () => {
    await POST(request());
    expect(mocks.createResponse).toHaveBeenCalledTimes(1);
    const params = mocks.createResponse.mock.calls[0][0];
    expect(params.store).toBe(false);
    expect(params.input).toContain("<user_answers>");
    expect(params.input).toContain('"questionId": "q_time"');
  });

  it("charges one quota for all three paths", async () => {
    await POST(request());
    expect(mocks.consume).toHaveBeenCalledTimes(1);
    expect(mocks.createResponse).toHaveBeenCalledTimes(1);
  });

  it("does not send stale answers from an inactive branch", async () => {
    await POST(request(fullAnswers({ q9: { choiceIds: ["q9_abroad"] } })));
    expect(mocks.createResponse.mock.calls[0][0].input).not.toContain('"q9"');
  });

  it("refunds once and does not retry when the model call fails", async () => {
    mocks.createResponse.mockRejectedValue(new Error("secret upstream detail"));

    const res = await POST(request());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).not.toContain("secret upstream detail");
    expect(mocks.createResponse).toHaveBeenCalledTimes(1);
    expect(mocks.refund).toHaveBeenCalledTimes(1);
    expect(mocks.refund).toHaveBeenCalledWith("user1", "2026-11");
    expect(loggedReason()).toMatchObject({ success: false, blockedReason: "OPENAI_ERROR" });
  });

  it.each([
    ["empty output", { output_text: "" }, "MODEL_EMPTY_RESPONSE"],
    ["broken JSON", { output_text: "{" }, "MODEL_INVALID_JSON"],
    ["wrong shape", { output_text: "{}" }, "MODEL_INVALID_SCHEMA"],
    ["output cut off", { status: "incomplete", output_text: "{" }, "MODEL_INCOMPLETE"],
  ])("refunds on %s", async (_name, output, reason) => {
    mocks.createResponse.mockResolvedValue(output);

    const res = await POST(request());

    expect(res.status).toBe(502);
    expect(mocks.createResponse).toHaveBeenCalledTimes(1);
    expect(mocks.refund).toHaveBeenCalledTimes(1);
    expect(loggedReason()).toMatchObject({ success: false, blockedReason: reason });
  });

  it("treats evidence for an unsubmitted answer as a refunded failure", async () => {
    const response = validResponse();
    response.planForm.paths[0]!.years[0]!.evidence.questionIds = ["q9"];
    mocks.createResponse.mockResolvedValue({ output_text: JSON.stringify(response) });

    const res = await POST(request());

    expect(res.status).toBe(502);
    expect(mocks.refund).toHaveBeenCalledTimes(1);
  });

  it("logs only a reason code when validation fails", async () => {
    const response = validResponse();
    response.planForm.paths[0]!.years[0]!.evidence.questionIds = ["q9"];
    mocks.createResponse.mockResolvedValue({ output_text: JSON.stringify(response) });

    await POST(request());

    expect(console.error).toHaveBeenCalledWith(
      "[odyssey/generate] invalid model response:",
      "continue_year1_evidence_ids",
    );
  });

  it("does not refund when the quota was never charged", async () => {
    mocks.consume.mockRejectedValue(new Error("db down"));

    const res = await POST(request());

    expect(res.status).toBe(500);
    expect(mocks.createResponse).not.toHaveBeenCalled();
    expect(mocks.refund).not.toHaveBeenCalled();
  });

  it("keeps quota, block and auth checks before the model call", async () => {
    mocks.consume.mockResolvedValue({ allowed: false, usedCount: 2 });
    expect((await POST(request())).status).toBe(429);

    mocks.userState.mockResolvedValue({ aiBlocked: true });
    expect((await POST(request())).status).toBe(403);

    mocks.config.mockResolvedValue({ value: "false" });
    expect((await POST(request())).status).toBe(503);

    mocks.getUser.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);

    expect(mocks.createResponse).not.toHaveBeenCalled();
  });

  it("rejects malformed answers before charging", async () => {
    const res = await POST(request({ q1: { choiceIds: "q1_work" } }));
    expect(res.status).toBe(400);
    expect(mocks.consume).not.toHaveBeenCalled();
  });
});
