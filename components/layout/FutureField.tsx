"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  applyFill,
  bloomOrbs,
  createOrbs,
  findLinks,
  pulseOrbs,
  settleOrbColors,
  stepOrbs,
  type FieldPoint,
  type Orb,
} from "@/features/field/future-field-core";
import {
  clearFieldBloom,
  getFieldFill,
  subscribeField,
} from "@/features/field/future-field-store";

type FieldPreset = {
  drift: number;
  pointerForce: number;
  opacity: number;
  /** Lower rates on quiet screens save battery. */
  frameMs: number;
};

const LANDING: FieldPreset = { drift: 1, pointerForce: 1, opacity: 1, frameMs: 16 };
const START: FieldPreset = { drift: 0.7, pointerForce: 0.6, opacity: 0.8, frameMs: 16 };
const RESULT: FieldPreset = { drift: 0.45, pointerForce: 0.4, opacity: 0.85, frameMs: 16 };
const INTERVIEW: FieldPreset = { drift: 0.3, pointerForce: 0.2, opacity: 0.65, frameMs: 24 };
const EDITOR: FieldPreset = { drift: 0.12, pointerForce: 0, opacity: 0.35, frameMs: 33 };

function presetFor(pathname: string): FieldPreset {
  if (pathname === "/") return LANDING;
  if (pathname === "/my-plan") return RESULT;
  if (pathname === "/plan/new/ai") return INTERVIEW;
  if (pathname === "/plan/new/manual" || pathname === "/plan/edit") return EDITOR;
  return START;
}

const LIGHT_COLORS = ["#6d8fd0", "#46a593", "#e0a052", "#d0739a", "#8f7fd3"];
const DARK_COLORS = ["#7f9fdc", "#5cbba8", "#e4ae68", "#dc88ab", "#a394e0"];
const LIGHT_NEUTRAL = "#a6a39a";
const DARK_NEUTRAL = "#6d6d70";
const SPRITE_SIZE = 128;
const MAX_PIXEL_RATIO = 1.5;
const LINK_REACH_PX = 340;
const POINTER_IDLE_MS = 1400;
const PRESET_EASE = 2.5;

function makeSprite(color: string): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = SPRITE_SIZE;
  const ctx = sprite.getContext("2d");
  if (ctx) {
    const half = SPRITE_SIZE / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.45, `${color}b0`);
    gradient.addColorStop(1, `${color}00`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  }
  return sprite;
}

/**
 * Background of soft orbs. Everything runs on refs and one animation frame loop,
 * so pointer movement never renders React. The canvas ignores input and is hidden
 * from assistive tech; PDF routes and the admin area do not mount it.
 */
export function FutureField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname() ?? "/";
  const targetPresetRef = useRef(presetFor(pathname));
  const wakeRef = useRef<() => void>(() => {});

  useEffect(() => {
    targetPresetRef.current = presetFor(pathname);
    if (pathname !== "/my-plan") clearFieldBloom();
    wakeRef.current();
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const darkMode = window.matchMedia("(prefers-color-scheme: dark)");

    let width = window.innerWidth;
    let height = window.innerHeight;
    let orbs: Orb[] = [];
    let colorSprites: HTMLCanvasElement[] = [];
    let neutralSprite: HTMLCanvasElement;
    let frame = 0;
    let lastFrame = 0;
    let pointer: FieldPoint | null = null;
    let pointerMovedAt = 0;
    let lastAction: FieldPoint | null = null;
    const preset = { ...targetPresetRef.current };

    const loadSprites = () => {
      const dark = darkMode.matches;
      colorSprites = (dark ? DARK_COLORS : LIGHT_COLORS).map(makeSprite);
      neutralSprite = makeSprite(dark ? DARK_NEUTRAL : LIGHT_NEUTRAL);
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 1;
      ctx.strokeStyle = darkMode.matches ? "#8f8f93" : "#8d8a80";
      for (const [a, b] of findLinks(orbs, LINK_REACH_PX)) {
        ctx.globalAlpha = 0.3 * preset.opacity * Math.min(a.color, b.color);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      for (const orb of orbs) {
        const size = orb.radius * 2;
        const left = orb.x - orb.radius;
        const top = orb.y - orb.radius;
        const base = preset.opacity * (0.42 + orb.glow * 0.3);
        if (orb.color < 1) {
          ctx.globalAlpha = Math.min(1, base * (1 - orb.color));
          ctx.drawImage(neutralSprite, left, top, size, size);
        }
        if (orb.color > 0) {
          ctx.globalAlpha = Math.min(1, base * 1.5 * orb.color);
          ctx.drawImage(colorSprites[orb.colorIndex]!, left, top, size, size);
        }
      }
      ctx.globalAlpha = 1;
    };

    const isStatic = () => reducedMotion.matches;

    const tick = (now: number) => {
      frame = 0;
      if (document.hidden || isStatic()) return;
      schedule();

      const elapsed = now - lastFrame;
      if (elapsed < preset.frameMs) return;
      const dt = Math.min(elapsed, 50) / 1000;
      lastFrame = now;

      const target = targetPresetRef.current;
      const ease = Math.min(1, PRESET_EASE * dt);
      preset.drift += (target.drift - preset.drift) * ease;
      preset.pointerForce += (target.pointerForce - preset.pointerForce) * ease;
      preset.opacity += (target.opacity - preset.opacity) * ease;
      preset.frameMs = target.frameMs;

      if (pointer && now - pointerMovedAt > POINTER_IDLE_MS) pointer = null;
      stepOrbs(orbs, dt, now / 1000, now, preset, pointer);
      draw();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const refresh = () => {
      if (isStatic()) {
        Object.assign(preset, targetPresetRef.current);
        settleOrbColors(orbs);
        draw();
      } else {
        lastFrame = performance.now();
        schedule();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      pointerMovedAt = performance.now();
    };
    const onPointerLeave = () => {
      pointer = null;
    };
    const onPointerDown = (e: PointerEvent) => {
      lastAction = { x: e.clientX, y: e.clientY };
      if (!isStatic()) pulseOrbs(orbs, lastAction);
    };

    const unsubscribe = subscribeField((event) => {
      if (event.type === "bloom") {
        bloomOrbs(
          orbs,
          getFieldFill(),
          { x: width / 2, y: height / 2 },
          performance.now(),
        );
      } else {
        applyFill(orbs, getFieldFill(), lastAction);
      }
      if (isStatic()) refresh();
    });

    loadSprites();
    resize();
    orbs = createOrbs(width, height);
    applyFill(orbs, getFieldFill(), null);
    wakeRef.current = refresh;
    refresh();

    const onResize = () => {
      resize();
      if (isStatic()) draw();
    };
    const onScheme = () => {
      loadSprites();
      refresh();
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", refresh);
    reducedMotion.addEventListener("change", refresh);
    darkMode.addEventListener("change", onScheme);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      wakeRef.current = () => {};
      unsubscribe();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", refresh);
      reducedMotion.removeEventListener("change", refresh);
      darkMode.removeEventListener("change", onScheme);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-future-field
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
