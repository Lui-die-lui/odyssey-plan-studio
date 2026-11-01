import { describe, expect, it } from "vitest";

import {
  applyFill,
  bloomOrbs,
  computePlanFill,
  createOrbs,
  fieldOrbCount,
  findLinks,
  pulseOrbs,
  settleOrbColors,
  stepOrbs,
  type Orb,
} from "./future-field-core";

function seeded() {
  let value = 0.42;
  return () => {
    value = (value * 9301 + 0.49297) % 1;
    return value;
  };
}

const orbsFor = (width = 1440, height = 900) => createOrbs(width, height, seeded());
const calm = { drift: 1, pointerForce: 1 };
const filledCount = (orbs: Orb[]) => orbs.filter((o) => o.filled).length;

function settle(orbs: Orb[], motion = calm, pointer: { x: number; y: number } | null = null) {
  for (let i = 0; i < 600; i++) stepOrbs(orbs, 1 / 30, i / 30, 0, motion, pointer);
}

describe("createOrbs", () => {
  it("limits orb count by screen width", () => {
    expect(fieldOrbCount(390)).toBeLessThan(fieldOrbCount(1440));
    expect(fieldOrbCount(4000)).toBe(28);
    expect(orbsFor(390, 844)).toHaveLength(14);
  });

  it("starts uncolored, since nothing has been chosen yet", () => {
    expect(orbsFor().every((o) => !o.filled && o.color === 0)).toBe(true);
  });
});

describe("stepOrbs", () => {
  it("drifts on its own without input", () => {
    const orbs = orbsFor();
    const start = orbs[0]!.x;
    settle(orbs);
    expect(orbs[0]!.x).not.toBe(start);
  });

  it("pushes nearby orbs away from the pointer", () => {
    const orbs = orbsFor();
    const orb = orbs[0]!;
    settle(orbs);
    const pointer = { x: orb.x + 60, y: orb.y };
    const before = orb.x;
    for (let i = 0; i < 20; i++) stepOrbs(orbs, 1 / 30, 20, 0, calm, pointer);
    expect(orb.x).toBeLessThan(before);
  });

  it("returns close to its path once the pointer is gone", () => {
    const orbs = orbsFor();
    const orb = orbs[0]!;
    settle(orbs, calm, { x: orb.homeX + 40, y: orb.homeY });
    settle(orbs, calm, null);
    expect(Math.hypot(orb.x - orb.homeX, orb.y - orb.homeY)).toBeLessThan(70);
  });

  it("ignores the pointer where the preset turns it off", () => {
    const orbs = orbsFor();
    const orb = orbs[0]!;
    settle(orbs, { drift: 0, pointerForce: 0 }, { x: orb.homeX + 20, y: orb.homeY });
    expect(Math.hypot(orb.x - orb.homeX, orb.y - orb.homeY)).toBeLessThan(1);
  });
});

describe("pulseOrbs", () => {
  it("affects only nearby orbs, not the whole screen", () => {
    const orbs = orbsFor();
    const affected = pulseOrbs(orbs, { x: 720, y: 450 });
    expect(affected).toBeLessThan(orbs.length / 2);
    expect(orbs.some((o) => o.glow === 0)).toBe(true);
  });
});

describe("applyFill", () => {
  it("colors exactly the share the ratio calls for", () => {
    const orbs = orbsFor();
    applyFill(orbs, 0.5, null);
    expect(filledCount(orbs)).toBe(14);
    applyFill(orbs, 1.5, null);
    expect(filledCount(orbs)).toBe(28);
  });

  it("removes color when the user removes content", () => {
    const orbs = orbsFor();
    applyFill(orbs, 0.5, null);
    applyFill(orbs, 0.25, null);
    expect(filledCount(orbs)).toBe(7);
  });

  it("adds color next to where the user acted", () => {
    const orbs = orbsFor();
    const target = orbs[10]!;
    applyFill(orbs, 1 / orbs.length, { x: target.x, y: target.y });
    expect(target.filled).toBe(true);
  });

  it("does not change which orbs are colored when the ratio holds", () => {
    const orbs = orbsFor();
    applyFill(orbs, 0.5, null);
    const before = orbs.map((o) => o.filled);
    applyFill(orbs, 0.5, { x: 0, y: 0 });
    expect(orbs.map((o) => o.filled)).toEqual(before);
  });
});

describe("bloomOrbs", () => {
  it("reaches near orbs before far ones", () => {
    const orbs = orbsFor();
    const origin = { x: 720, y: 450 };
    bloomOrbs(orbs, 1, origin, 1000);
    const byDistance = [...orbs].sort(
      (a, b) =>
        Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y),
    );
    expect(byDistance[0]!.colorAt).toBeLessThan(byDistance[byDistance.length - 1]!.colorAt);
  });

  it("settles immediately for a static field", () => {
    const orbs = orbsFor();
    bloomOrbs(orbs, 0.5, { x: 0, y: 0 }, 1000);
    settleOrbColors(orbs);
    expect(orbs.filter((o) => o.color === 1)).toHaveLength(14);
    expect(orbs.every((o) => o.colorAt === 0)).toBe(true);
  });
});

describe("findLinks", () => {
  const near = (orbs: Orb[]) => {
    orbs.slice(0, 4).forEach((orb, i) => {
      orb.x = 100 + i * 10;
      orb.y = 100;
      orb.color = 1;
    });
    return orbs;
  };

  it("connects only colored orbs", () => {
    expect(findLinks(orbsFor(), 340)).toEqual([]);
  });

  it("keeps links sparse", () => {
    const orbs = near(orbsFor());
    const links = findLinks(orbs, 340);
    const degree = (orb: Orb) => links.filter(([a, b]) => a === orb || b === orb).length;
    expect(links.length).toBeGreaterThan(0);
    expect(Math.max(...orbs.map(degree))).toBeLessThanOrEqual(2);
  });
});

describe("computePlanFill", () => {
  const year = (goals: number, rated: number) => ({
    goals: Array(goals).fill("g"),
    scores: {
      resources: rated > 0 ? 1 : null,
      interest: rated > 1 ? 1 : null,
      confidence: rated > 2 ? 1 : null,
      coherence: rated > 3 ? 1 : null,
    },
  });

  it("is empty until the user adds something", () => {
    expect(computePlanFill([year(0, 0), year(0, 0)])).toBe(0);
    expect(computePlanFill([])).toBe(0);
  });

  it("grows with goals, then with ratings", () => {
    const goalsOnly = computePlanFill([year(1, 0), year(1, 0)]);
    const rated = computePlanFill([year(1, 4), year(1, 4)]);
    expect(goalsOnly).toBeGreaterThan(0);
    expect(rated).toBeGreaterThan(goalsOnly);
  });

  it("treats a rating of 1 as filled and unrated as empty", () => {
    expect(computePlanFill([year(0, 4)])).toBeGreaterThan(computePlanFill([year(0, 0)]));
  });

  it("leaves room for the save bloom", () => {
    expect(computePlanFill([year(1, 4)])).toBeLessThan(1);
  });
});
