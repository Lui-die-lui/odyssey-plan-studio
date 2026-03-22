"use client";

import { SUBPAGE_VEIL_SURFACE_CLASS } from "./subpage-veil-styles";

/**
 * Thin frosted layer over {@link LandingConfetti} on non-home routes.
 * Keeps shapes visible but slightly softened (not main landing).
 */
export function SubpageGlassVeil() {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[1] ${SUBPAGE_VEIL_SURFACE_CLASS}`}
      aria-hidden
    />
  );
}