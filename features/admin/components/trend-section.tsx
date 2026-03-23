"use client";

import { useMemo, useState } from "react";

import { TrendChart, type TrendChartRow } from "@/features/admin/components/trend-chart";

type Granularity = "day" | "week" | "month";

type Props = {
  day: TrendChartRow[];
  week: TrendChartRow[];
  month: TrendChartRow[];
};

export function TrendSection({ day, week, month }: Props) {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const data = useMemo(() => {
    if (granularity === "week") return week;
    if (granularity === "month") return month;
    return day;
  }, [granularity, day, week, month]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-[#FEFEFE]">추이 차트</h2>
        <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 dark:border-white/10 dark:bg-zinc-950/40">
          {(["day", "week", "month"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={`rounded-md px-2.5 py-1 text-xs ${
                granularity === g
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {g.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <TrendChart title={`가입자/AI 요청 (${granularity.toUpperCase()})`} data={data} />
    </section>
  );
}
