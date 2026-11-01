import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { validResponse, validYear } from "@/features/plan/lib/__fixtures__/odyssey-generate.fixture";
import { mapOdysseyAiPlanFormToPlanFormValues } from "@/features/plan/lib/odyssey-ai-plan-draft.mapper";
import {
  mapAiDraftToPathForms,
  mapPathFormToSavePayload,
} from "@/features/plan/lib/plan-path.mapper";
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

  const singleForm = () =>
    mapOdysseyAiPlanFormToPlanFormValues({
      title: "단일 계획",
      years: [1, 2, 3, 4, 5].map((y) => validYear(y)),
    });
  const pathPayload = () =>
    mapAiDraftToPathForms(validResponse().planForm).map(mapPathFormToSavePayload);

  it("keeps guidance and unrated scores through save, reload and resave", async () => {
    const form = singleForm();
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
    expect(first.paths).toEqual([]);

    expect((await save(mapPlanFormValuesToSavePayload(form))).status).toBe(200);
    expect((await load()).years[0].aiGuidance).toEqual(form.years[0].aiGuidance);
  });

  it("adds paths without touching the single plan", async () => {
    const before = await load();
    const paths = pathPayload();
    paths[0]!.scores = { resources: 1, interest: null, confidence: null, coherence: null };
    paths[1]!.experiments[0]!.nextUp = true;
    paths[2]!.marks = ["curious"];

    expect((await save({ paths })).status).toBe(200);

    const after = await load();
    expect(after.title).toBe(before.title);
    expect(after.years).toEqual(before.years);
    expect(after.paths.map((p: { kind: string }) => p.kind)).toEqual([
      "continue",
      "alternative",
      "unbound",
    ]);
    expect(after.paths[0].scores.resources).toBe(1);
    expect(after.paths[0].scores.interest).toBeNull();
    expect(after.paths[0].years[0].scores.resources).toBeNull();
    expect(after.paths[1].experiments[0].nextUp).toBe(true);
    expect(after.paths[2].marks).toEqual(["curious"]);
    expect(after.paths[0].years[0].aiGuidance.checkpoint).toBeTruthy();
    expect(after.paths[0].years).toHaveLength(5);
  });

  it("updates a path and leaves the single plan, then edits the single plan alone", async () => {
    const before = await load();
    const paths = pathPayload();
    paths[0]!.title = "수정한 경로";
    expect((await save({ paths })).status).toBe(200);

    const edited = await load();
    expect(edited.paths[0].title).toBe("수정한 경로");
    expect(edited.years).toEqual(before.years);

    const form = singleForm();
    form.title = "수정한 단일 계획";
    expect((await save(mapPlanFormValuesToSavePayload(form))).status).toBe(200);
    const final = await load();
    expect(final.title).toBe("수정한 단일 계획");
    expect(final.paths[0].title).toBe("수정한 경로");
    expect(final.paths).toHaveLength(3);
  });

  it("saves a plan that has no AI fields", async () => {
    const payload = mapPlanFormValuesToSavePayload(singleForm());
    for (const year of payload.years) year.aiGuidance = undefined;

    expect((await save(payload)).status).toBe(200);
    expect((await load()).years[0].aiGuidance).toBeUndefined();
  });
});
