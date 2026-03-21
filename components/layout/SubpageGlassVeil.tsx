"use client";

/**
 * Thin frosted layer over {@link LandingConfetti} on non-home routes.
 * Keeps shapes visible but slightly softened (not main landing).
 */
export function SubpageGlassVeil() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] bg-white/[0.06] backdrop-blur-[2px] dark:bg-white/[0.035] dark:backdrop-blur-[3px]"
      aria-hidden
    />
  );
}
