"use client";

import { useEffect, useRef } from "react";

/**
 * Stands in for the native scrollbar, which is hidden so pages never shift
 * sideways when they become scrollable. Keyboard and wheel scrolling are unchanged.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      const range = root.scrollHeight - window.innerHeight;
      bar.style.opacity = range > 1 ? "1" : "0";
      bar.style.transform = `scaleX(${range > 1 ? Math.min(1, window.scrollY / range) : 0})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", schedule);
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden
      data-scroll-progress
      style={{ transform: "scaleX(0)", opacity: 0 }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
    />
  );
}
