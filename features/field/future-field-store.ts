/**
 * Commands from the app to the background field. Plain module state on purpose:
 * pages report real actions here without any React update on the field or themselves.
 */

type FieldEvent = { type: "fill" } | { type: "bloom" };
type FieldListener = (event: FieldEvent) => void;

let fill = 0;
let bloomBoost = 0;
const listeners = new Set<FieldListener>();

const emit = (event: FieldEvent) => {
  for (const listener of listeners) listener(event);
};

export const SAVE_BLOOM_BOOST = 0.3;

export function subscribeField(listener: FieldListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getFieldFill(): number {
  return Math.min(1, fill + bloomBoost);
}

/** `ratio` must come from what the user really did, never from elapsed time. */
export function setFieldFill(ratio: number): void {
  if (ratio === fill) return;
  fill = ratio;
  emit({ type: "fill" });
}

/** A plan was saved: color spreads wider for as long as the user stays on this page. */
export function bloomField(): void {
  bloomBoost = SAVE_BLOOM_BOOST;
  emit({ type: "bloom" });
}

export function clearFieldBloom(): void {
  if (bloomBoost === 0) return;
  bloomBoost = 0;
  emit({ type: "fill" });
}
