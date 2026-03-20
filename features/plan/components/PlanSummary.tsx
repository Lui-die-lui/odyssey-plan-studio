/* eslint-disable react/no-array-index-key */
"use client";

import type { SavedPlanResponse, YearlyPlanItem } from "../types/plan.types";

export type PlanSummaryProps = {
  plan: SavedPlanResponse | null;
  emptyStateMessage?: string;
};

const getMainYearlyItem = (items: YearlyPlanItem[]) => {
  const currentYear = new Date().getFullYear();
  const match = items.find((i) => i.year === currentYear);
  if (match) return match;
  return items[0];
};

const PlanSummary = ({
  plan,
  emptyStateMessage,
}: PlanSummaryProps) => {
  if (!plan) {
    return (
      <div className="w-full rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {emptyStateMessage ?? "No plan saved yet."}
        </p>
      </div>
    );
  }

  const yearlyItems = [...plan.yearlyItems].sort((a, b) => a.year - b.year);
  const mainItem = getMainYearlyItem(yearlyItems);

  return (
    <div className="flex w-full flex-col gap-4 rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          {plan.title ?? "My Odyssey Plan"}
        </h2>
        {mainItem ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Main goal:{" "}
            <span className="font-medium text-black dark:text-zinc-50">
              {mainItem.goal}
            </span>{" "}
            ({mainItem.year})
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {yearlyItems.map((item, idx) => (
          <article
            key={`${item.year}-${idx}`}
            className="rounded-md border border-black/10 p-3 dark:border-white/10"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
                {item.year}: {item.goal}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {item.summary}
              </p>
            </div>

            {item.strengths?.length ? (
              <div className="mt-2">
                <p className="text-xs font-medium text-black/80 dark:text-zinc-200">
                  Strengths
                </p>
                <ul className="mt-1 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.strengths.map((s, i) => (
                    <li key={`${item.year}-s-${i}`}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {item.weaknesses?.length ? (
              <div className="mt-2">
                <p className="text-xs font-medium text-black/80 dark:text-zinc-200">
                  Weaknesses
                </p>
                <ul className="mt-1 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                  {item.weaknesses.map((w, i) => (
                    <li key={`${item.year}-w-${i}`}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
};

export default PlanSummary;

