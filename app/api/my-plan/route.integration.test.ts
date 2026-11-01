import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { validResponse } from "@/features/plan/lib/__fixtures__/odyssey-generate.fixture";
import { mapOdysseyAiPlanFormToPlanFormValues } from "@/features/plan/lib/odyssey-ai-plan-draft.mapper";
import { mapPlanFormValuesToSavePayload } from "@/features/plan/lib/plan.mapper";

/**
 * Runs against a real Postgres only when TEST_DATABASE_URL is set, because it
 * writes rows. Point it at a disposable database with migrations applied.
 */
const databaseUrl = process.env.TEST_DATABASE_URL;

const session = vi.hoisted(() => ({ userId: "" }));

vi.mock("@/features/auth/lib/session-user", () => ({
  getActiveSessionUser: async () => ({ id: session.userId, role: "USER" }),
}));

describe.skipIf(!databaseUrl)("/api/my-plan persistence", () => {
  let prisma: typeof import("@/lib/prisma").prisma;
  let route: typeof import("./route");

  const save = (payload: unknown) =>
    route.POST(
      new Request("https://example.com/api/my-plan", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
  const load = async () => (await (await route.GET()).json()).data;

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", databaseUrl as string);
    ({ prisma } = await import("@/lib/prisma"));
    route = await import("./route");
    const user = await prisma.user.create({ data: { email: "plan-roundtrip@example.com" } });
    session.userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: session.userId } });
    await prisma.$disconnect();
  });

  it("keeps guidance and unrated scores through save, reload and resave", async () => {
    const form = mapOdysseyAiPlanFormToPlanFormValues(validResponse().planForm);
    form.years[0].scores.resources = 1;

    expect((await save(mapPlanFormValuesToSavePayload(form))).status).toBe(201);

    const first = await load();
    expect(first.years[0].scores).toEqual({
      resources: 1,
      interest: null,
      confidence: null,
      coherence: null,
    });
    expect(first.years[0].aiGuidance).toEqual(form.years[0].aiGuidance);
    expect(first.years[4].aiGuidance.pivotCondition).toBe(form.years[4].aiGuidance?.pivotCondition);

    // A full replacement save must not lose what only the form carries.
    expect((await save(mapPlanFormValuesToSavePayload(form))).status).toBe(200);
    expect((await load()).years[0].aiGuidance).toEqual(form.years[0].aiGuidance);
  });

  it("saves a plan that has no AI fields", async () => {
    const form = mapOdysseyAiPlanFormToPlanFormValues(validResponse().planForm);
    const payload = mapPlanFormValuesToSavePayload(form);
    for (const year of payload.years) year.aiGuidance = undefined;

    expect((await save(payload)).status).toBe(200);
    expect((await load()).years[0].aiGuidance).toBeUndefined();
  });
});
