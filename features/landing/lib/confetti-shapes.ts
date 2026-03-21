/**
 * Landing confetti: shared geometry + motion; colors/opacity live in theme palettes.
 * Dark shapes are matte mid-tones (not bright specks) so they read as floating UI graphics.
 */

export type LandingConfettiType = "circle" | "line" | "square" | "triangle";

/** Placement, size, animation — identical in light and dark */
export type LandingConfettiLayoutDef = {
  id: string;
  type: LandingConfettiType;
  /** Circle ∅, square side, line length (px); triangle uses this as SVG box */
  size: number;
  top: string;
  left: string;
  delay: number;
  duration: number;
  rotateDeg?: number;
  /** Vertical float amplitude (px), typically 4–9 */
  driftPx?: number;
};

/** Runtime piece (layout + resolved theme) */
export type LandingConfettiDef = LandingConfettiLayoutDef & {
  opacity: number;
  color: string;
};

export type LandingConfettiVisual = {
  color: string;
  opacity: number;
};

export const LANDING_CONFETTI_LAYOUT: LandingConfettiLayoutDef[] = [
  {
    id: "c-lt",
    type: "circle",
    size: 28,
    left: "5%",
    top: "10%",
    delay: 0,
    duration: 6.5,
    driftPx: 7,
  },
  {
    id: "sq-lm",
    type: "square",
    size: 20,
    left: "7%",
    top: "52%",
    delay: 0.8,
    duration: 7,
    rotateDeg: 18,
    driftPx: 6,
  },
  {
    id: "ln-lb",
    type: "line",
    size: 32,
    left: "4%",
    top: "82%",
    delay: 1.2,
    duration: 5.5,
    rotateDeg: -25,
    driftPx: 8,
  },
  {
    id: "tri-lu",
    type: "triangle",
    size: 34,
    left: "14%",
    top: "22%",
    delay: 2,
    duration: 8,
    rotateDeg: -12,
    driftPx: 5,
  },
  {
    id: "c-rt",
    type: "circle",
    size: 22,
    left: "91%",
    top: "14%",
    delay: 0.4,
    duration: 7.5,
    driftPx: 6,
  },
  {
    id: "sq-rm",
    type: "square",
    size: 22,
    left: "88%",
    top: "48%",
    delay: 1.5,
    duration: 6,
    rotateDeg: -24,
    driftPx: 7,
  },
  {
    id: "ln-rb",
    type: "line",
    size: 28,
    left: "86%",
    top: "78%",
    delay: 0.2,
    duration: 8.5,
    rotateDeg: 42,
    driftPx: 6,
  },
  {
    id: "tri-ru",
    type: "triangle",
    size: 28,
    left: "80%",
    top: "26%",
    delay: 2.4,
    duration: 5.8,
    rotateDeg: 20,
    driftPx: 9,
  },
  {
    id: "c-tl",
    type: "circle",
    size: 18,
    left: "22%",
    top: "6%",
    delay: 1,
    duration: 6.2,
    driftPx: 5,
  },
  {
    id: "ln-tr",
    type: "line",
    size: 24,
    left: "78%",
    top: "8%",
    delay: 1.8,
    duration: 7.2,
    rotateDeg: 12,
    driftPx: 7,
  },
  {
    id: "sq-bl",
    type: "square",
    size: 18,
    left: "18%",
    top: "88%",
    delay: 0.6,
    duration: 9,
    rotateDeg: 33,
    driftPx: 6,
  },
  {
    id: "c-br",
    type: "circle",
    size: 20,
    left: "84%",
    top: "90%",
    delay: 2.8,
    duration: 6.8,
    driftPx: 5,
  },
  {
    id: "sq-accent-l",
    type: "square",
    size: 18,
    left: "3%",
    top: "36%",
    delay: 1.4,
    duration: 7,
    rotateDeg: 8,
    driftPx: 6,
  },
  {
    id: "c-accent-r",
    type: "circle",
    size: 15,
    left: "94%",
    top: "62%",
    delay: 2.2,
    duration: 8,
    driftPx: 7,
  },
  /* Center-adjacent — same mood, softer opacity so copy stays readable */
  {
    id: "c-mc1",
    type: "circle",
    size: 16,
    left: "48%",
    top: "20%",
    delay: 0.5,
    duration: 7,
    driftPx: 5,
  },
  {
    id: "ln-m1",
    type: "line",
    size: 26,
    left: "40%",
    top: "40%",
    delay: 1.1,
    duration: 6.4,
    rotateDeg: -32,
    driftPx: 6,
  },
  {
    id: "sq-m1",
    type: "square",
    size: 14,
    left: "58%",
    top: "52%",
    delay: 0.3,
    duration: 7.2,
    rotateDeg: 22,
    driftPx: 5,
  },
  {
    id: "tri-m1",
    type: "triangle",
    size: 20,
    left: "52%",
    top: "78%",
    delay: 1.6,
    duration: 6.8,
    rotateDeg: 8,
    driftPx: 6,
  },
  {
    id: "c-mc2",
    type: "circle",
    size: 12,
    left: "44%",
    top: "64%",
    delay: 2,
    duration: 5.9,
    driftPx: 4,
  },
  {
    id: "ln-m2",
    type: "line",
    size: 22,
    left: "54%",
    top: "28%",
    delay: 0.9,
    duration: 8,
    rotateDeg: 18,
    driftPx: 7,
  },
];

/** Light: current production look — cool neutrals + soft blue/indigo accents */
export const LANDING_CONFETTI_THEME_LIGHT: Record<string, LandingConfettiVisual> = {
  "c-lt": { color: "#c4c4cc", opacity: 0.72 },
  "sq-lm": { color: "#d4d4d8", opacity: 0.65 },
  "ln-lb": { color: "#b4b4bd", opacity: 0.7 },
  "tri-lu": { color: "#a8a8b3", opacity: 0.68 },
  "c-rt": { color: "#d1d1d6", opacity: 0.62 },
  "sq-rm": { color: "#c8c8d0", opacity: 0.66 },
  "ln-rb": { color: "#bcbcc6", opacity: 0.64 },
  "tri-ru": { color: "#9ca3af", opacity: 0.6 },
  "c-tl": { color: "#d8d8dc", opacity: 0.55 },
  "ln-tr": { color: "#c4c4cc", opacity: 0.58 },
  "sq-bl": { color: "#d1d1d6", opacity: 0.58 },
  "c-br": { color: "#e4e4e7", opacity: 0.52 },
  "sq-accent-l": { color: "#93c5fd", opacity: 0.45 },
  "c-accent-r": { color: "#a5b4fc", opacity: 0.42 },
  "c-mc1": { color: "#d4d4d8", opacity: 0.46 },
  "ln-m1": { color: "#c4c4cc", opacity: 0.42 },
  "sq-m1": { color: "#d1d1d6", opacity: 0.4 },
  "tri-m1": { color: "#b4b4bd", opacity: 0.4 },
  "c-mc2": { color: "#e4e4e7", opacity: 0.38 },
  "ln-m2": { color: "#c8c8d0", opacity: 0.36 },
};

/**
 * Dark: matte zinc-violet surfaces, restrained opacity — reads as layered graphics, not stars/dust.
 */
export const LANDING_CONFETTI_THEME_DARK: Record<string, LandingConfettiVisual> = {
  "c-lt": { color: "#4f4f59", opacity: 0.4 },
  "sq-lm": { color: "#505058", opacity: 0.38 },
  "ln-lb": { color: "#4a4a52", opacity: 0.42 },
  "tri-lu": { color: "#52525c", opacity: 0.37 },
  "c-rt": { color: "#55555e", opacity: 0.36 },
  "sq-rm": { color: "#4e4e56", opacity: 0.39 },
  "ln-rb": { color: "#484850", opacity: 0.38 },
  "tri-ru": { color: "#4f4f58", opacity: 0.34 },
  "c-tl": { color: "#5a5a64", opacity: 0.32 },
  "ln-tr": { color: "#4d4d56", opacity: 0.36 },
  "sq-bl": { color: "#51515a", opacity: 0.35 },
  "c-br": { color: "#60606a", opacity: 0.3 },
  "sq-accent-l": { color: "#697896", opacity: 0.34 },
  "c-accent-r": { color: "#6c7894", opacity: 0.32 },
  "c-mc1": { color: "#55555e", opacity: 0.26 },
  "ln-m1": { color: "#4d4d56", opacity: 0.24 },
  "sq-m1": { color: "#52525c", opacity: 0.24 },
  "tri-m1": { color: "#4a4a52", opacity: 0.24 },
  "c-mc2": { color: "#60606a", opacity: 0.22 },
  "ln-m2": { color: "#505058", opacity: 0.22 },
};

function mergeLandingConfetti(
  layout: LandingConfettiLayoutDef[],
  palette: Record<string, LandingConfettiVisual>,
): LandingConfettiDef[] {
  return layout.map((item) => {
    const visual = palette[item.id];
    if (!visual) {
      throw new Error(`Landing confetti: missing theme entry for id "${item.id}"`);
    }
    return { ...item, ...visual };
  });
}

export const LANDING_CONFETTI_SHAPES_LIGHT = mergeLandingConfetti(
  LANDING_CONFETTI_LAYOUT,
  LANDING_CONFETTI_THEME_LIGHT,
);

export const LANDING_CONFETTI_SHAPES_DARK = mergeLandingConfetti(
  LANDING_CONFETTI_LAYOUT,
  LANDING_CONFETTI_THEME_DARK,
);
