/**
 * Simulation for the background "future field": soft orbs that drift, react to
 * the pointer and gain color from real user actions. No DOM here, so it can be tested.
 */

export type Orb = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  homeX: number;
  homeY: number;
  radius: number;
  phase: number;
  /** Radians per second of the drift path. */
  speed: number;
  colorIndex: number;
  /** Whether a user action has claimed this orb. */
  filled: boolean;
  /** When a claimed orb starts showing color, for the save wave. */
  colorAt: number;
  /** Shown color amount, eased toward `filled`. */
  color: number;
  /** Short brightening after a nearby click. */
  glow: number;
};

export type FieldMotion = {
  /** Multiplier for drift distance. */
  drift: number;
  /** Multiplier for pointer push. */
  pointerForce: number;
};

export type FieldPoint = { x: number; y: number };

export const FIELD_COLOR_COUNT = 5;

const DRIFT_RANGE_PX = 46;
const POINTER_RANGE_PX = 240;
const POINTER_PUSH = 900;
const SPRING = 2.2;
const DAMPING = 2.6;
const COLOR_RATE = 1.8;
const GLOW_DECAY = 1.6;
const PULSE_RANGE_PX = 190;
const PULSE_IMPULSE = 150;
const BLOOM_WAVE_PX_PER_MS = 0.9;

export function fieldOrbCount(width: number): number {
  return width < 640 ? 14 : width < 1024 ? 20 : 28;
}

export function createOrbs(
  width: number,
  height: number,
  random: () => number = Math.random,
): Orb[] {
  const count = fieldOrbCount(width);
  return Array.from({ length: count }, (_, index) => {
    const homeX = random() * width;
    const homeY = random() * height;
    // Mostly small with a few large orbs, so the field has depth.
    const size = random();
    const radius = 22 + size * size * size * 170;
    return {
      x: homeX,
      y: homeY,
      vx: 0,
      vy: 0,
      homeX,
      homeY,
      radius,
      phase: random() * Math.PI * 2,
      speed: 0.08 + random() * 0.14,
      colorIndex: index % FIELD_COLOR_COUNT,
      filled: false,
      colorAt: 0,
      color: 0,
      glow: 0,
    };
  });
}

export function stepOrbs(
  orbs: Orb[],
  dtSeconds: number,
  timeSeconds: number,
  nowMs: number,
  motion: FieldMotion,
  pointer: FieldPoint | null,
): void {
  for (const orb of orbs) {
    const pathX = Math.sin(timeSeconds * orb.speed + orb.phase);
    const pathY = Math.cos(timeSeconds * orb.speed * 0.8 + orb.phase);
    const targetX = orb.homeX + pathX * DRIFT_RANGE_PX * motion.drift;
    const targetY = orb.homeY + pathY * DRIFT_RANGE_PX * motion.drift;

    let ax = (targetX - orb.x) * SPRING;
    let ay = (targetY - orb.y) * SPRING;

    if (pointer && motion.pointerForce > 0) {
      const dx = orb.x - pointer.x;
      const dy = orb.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance < POINTER_RANGE_PX) {
        const strength = (1 - distance / POINTER_RANGE_PX) * POINTER_PUSH * motion.pointerForce;
        ax += (dx / distance) * strength;
        ay += (dy / distance) * strength;
      }
    }

    orb.vx += (ax - orb.vx * DAMPING) * dtSeconds;
    orb.vy += (ay - orb.vy * DAMPING) * dtSeconds;
    orb.x += orb.vx * dtSeconds;
    orb.y += orb.vy * dtSeconds;

    const targetColor = orb.filled && nowMs >= orb.colorAt ? 1 : 0;
    orb.color += (targetColor - orb.color) * Math.min(1, COLOR_RATE * dtSeconds);
    orb.glow = Math.max(0, orb.glow - GLOW_DECAY * dtSeconds);
  }
}

/** Skips easing when nothing animates, so a static field still shows the true state. */
export function settleOrbColors(orbs: Orb[]): void {
  for (const orb of orbs) {
    orb.color = orb.filled ? 1 : 0;
    orb.colorAt = 0;
    orb.glow = 0;
  }
}

/** A click nudges and brightens only nearby orbs. */
export function pulseOrbs(orbs: Orb[], point: FieldPoint): number {
  let affected = 0;
  for (const orb of orbs) {
    const dx = orb.x - point.x;
    const dy = orb.y - point.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance > PULSE_RANGE_PX) continue;
    const strength = 1 - distance / PULSE_RANGE_PX;
    orb.vx += (dx / distance) * PULSE_IMPULSE * strength;
    orb.vy += (dy / distance) * PULSE_IMPULSE * strength;
    orb.glow = Math.min(1, orb.glow + strength);
    affected += 1;
  }
  return affected;
}

const byDistanceTo = (point: FieldPoint) => (a: Orb, b: Orb) =>
  Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y);

/**
 * Colors exactly as many orbs as the ratio calls for. New color appears next to
 * where the user acted, so a choice visibly lands in the field.
 */
export function applyFill(orbs: Orb[], ratio: number, near: FieldPoint | null): void {
  const target = Math.round(Math.min(1, Math.max(0, ratio)) * orbs.length);
  const filled = orbs.filter((o) => o.filled);

  if (filled.length < target) {
    const candidates = orbs.filter((o) => !o.filled);
    if (near) candidates.sort(byDistanceTo(near));
    for (const orb of candidates.slice(0, target - filled.length)) {
      orb.filled = true;
      orb.colorAt = 0;
    }
    return;
  }

  for (const orb of filled.slice(target)) orb.filled = false;
}

/** Spreads color outward from `origin`, reaching farther orbs later. */
export function bloomOrbs(
  orbs: Orb[],
  ratio: number,
  origin: FieldPoint,
  nowMs: number,
): void {
  applyFill(orbs, ratio, null);
  for (const orb of orbs) {
    const distance = Math.hypot(orb.x - origin.x, orb.y - origin.y);
    orb.colorAt = nowMs + distance / BLOOM_WAVE_PX_PER_MS;
    orb.color = Math.min(orb.color, 0.35);
  }
}

/** Colored orbs within reach of each other, at most two links per orb. */
export function findLinks(orbs: Orb[], reachPx: number): [Orb, Orb][] {
  const colored = orbs.filter((o) => o.color > 0.4);
  const links: [Orb, Orb][] = [];
  const degree = new Map<Orb, number>();

  for (let i = 0; i < colored.length; i++) {
    for (let j = i + 1; j < colored.length; j++) {
      const a = colored[i]!;
      const b = colored[j]!;
      if ((degree.get(a) ?? 0) >= 2 || (degree.get(b) ?? 0) >= 2) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > reachPx) continue;
      links.push([a, b]);
      degree.set(a, (degree.get(a) ?? 0) + 1);
      degree.set(b, (degree.get(b) ?? 0) + 1);
    }
  }
  return links;
}

type FillableYear = {
  goals: unknown[];
  scores: Record<string, number | null>;
};

/** How much of a plan the user has actually filled in: years with goals, then ratings. */
export function computePlanFill(years: FillableYear[]): number {
  if (!years.length) return 0;
  const yearsWithGoals = years.filter((y) => y.goals.length > 0).length / years.length;
  const scores = years.flatMap((y) => Object.values(y.scores));
  const rated = scores.length ? scores.filter((s) => s !== null).length / scores.length : 0;
  return yearsWithGoals * 0.65 + rated * 0.25;
}
