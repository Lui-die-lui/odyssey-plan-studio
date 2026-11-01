import { PLAN_PATHS, type PlanPathKind } from "../constants/plan-path.constants";

/** Letter and name always accompany the color, so color never carries the meaning alone. */
export function PlanPathBadge({ kind }: { kind: PlanPathKind }) {
  const { letter, name, color } = PLAN_PATHS[kind];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-2">
      <span
        aria-hidden
        style={{ backgroundColor: color }}
        className="inline-flex size-5 items-center justify-center rounded text-[11px] font-semibold text-white"
      >
        {letter}
      </span>
      {name}
    </span>
  );
}
