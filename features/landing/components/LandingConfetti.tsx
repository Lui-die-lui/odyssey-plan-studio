"use client";

import type { CSSProperties } from "react";

import type { LandingConfettiDef } from "../lib/confetti-shapes";
import {
  LANDING_CONFETTI_SHAPES_DARK,
  LANDING_CONFETTI_SHAPES_LIGHT,
} from "../lib/confetti-shapes";

const LINE_HEIGHT_PX = 4;

function confettiMotionStyle(def: LandingConfettiDef): CSSProperties {
  const base = def.driftPx ?? 8;
  const drift = Math.min(22, Math.max(9, Math.round(base * 1.5)));
  return {
    ["--landing-drift" as string]: `${-drift}px`,
    animationDuration: `${def.duration}s`,
    animationDelay: `${def.delay}s`,
  };
}

function ConfettiPiece({ def }: { def: LandingConfettiDef }) {
  const rotate = def.rotateDeg ?? 0;

  const wrapperStyle: CSSProperties = {
    left: def.left,
    top: def.top,
    opacity: def.opacity,
    transform: `rotate(${rotate}deg)`,
    transformOrigin: "center center",
  };

  const motion = confettiMotionStyle(def);

  switch (def.type) {
    case "circle":
      return (
        <span
          className="pointer-events-none absolute"
          style={{
            ...wrapperStyle,
            width: def.size,
            height: def.size,
          }}
          aria-hidden
        >
          <span
            className="landing-confetti-float pointer-events-none block size-full rounded-full"
            style={{
              ...motion,
              backgroundColor: def.color,
            }}
          />
        </span>
      );
    case "square":
      return (
        <span
          className="pointer-events-none absolute"
          style={{
            ...wrapperStyle,
            width: def.size,
            height: def.size,
          }}
          aria-hidden
        >
          <span
            className="landing-confetti-float pointer-events-none block size-full rounded-none"
            style={{
              ...motion,
              backgroundColor: def.color,
            }}
          />
        </span>
      );
    case "line":
      return (
        <span
          className="pointer-events-none absolute"
          style={{
            ...wrapperStyle,
            width: def.size,
            height: LINE_HEIGHT_PX,
          }}
          aria-hidden
        >
          <span
            className="landing-confetti-float pointer-events-none block size-full rounded-full"
            style={{
              ...motion,
              backgroundColor: def.color,
            }}
          />
        </span>
      );
    case "triangle": {
      const s = def.size;
      return (
        <span
          className="pointer-events-none absolute"
          style={{
            ...wrapperStyle,
            width: s,
            height: s,
          }}
          aria-hidden
        >
          <span
            className="landing-confetti-float pointer-events-none block size-full"
            style={motion}
          >
            <svg
              className="pointer-events-none block size-full"
              width={s}
              height={s}
              viewBox="0 0 24 24"
              aria-hidden
            >
              <polygon points="12,4 22,20 2,20" fill={def.color} />
            </svg>
          </span>
        </span>
      );
    }
    default:
      return null;
  }
}

function ConfettiLayer({
  defs,
  className,
}: {
  defs: LandingConfettiDef[];
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden
    >
      {defs.map((def) => (
        <ConfettiPiece key={def.id} def={def} />
      ))}
    </div>
  );
}

type LandingConfettiProps = {
  className?: string;
  defsLight?: LandingConfettiDef[];
  defsDark?: LandingConfettiDef[];
};

/**
 * Two layers toggled with Tailwind `dark:` (class on root).
 * Pass custom defs to scope shapes inside a smaller hero panel.
 */
export function LandingConfetti({
  className = "",
  defsLight,
  defsDark,
}: LandingConfettiProps) {
  const light = defsLight ?? LANDING_CONFETTI_SHAPES_LIGHT;
  const dark = defsDark ?? LANDING_CONFETTI_SHAPES_DARK;
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <ConfettiLayer defs={light} className="dark:hidden" />
      <ConfettiLayer defs={dark} className="hidden dark:block" />
    </div>
  );
}
