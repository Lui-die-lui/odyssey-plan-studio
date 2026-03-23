"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendChartRow = {
  label: string;
  signups: number;
  aiRequests: number;
};

export function TrendChart({
  title,
  data,
}: {
  title: string;
  data: TrendChartRow[];
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/40">
      <h3 className="mb-3 text-sm font-medium text-zinc-800 dark:text-[#FEFEFE]">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              stroke="var(--admin-chart-grid-color)"
              strokeDasharray="2 4"
              vertical
              horizontal
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "#8a919d" }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "#8a919d" }}
            />
            <Tooltip
              cursor={{ stroke: "#d4dde8", strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e5e9f0",
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
              }}
              labelStyle={{ color: "#4b5563", fontSize: 12, fontWeight: 600 }}
              itemStyle={{ color: "#334155", fontSize: 12 }}
              formatter={(value, key) => {
                const safe =
                  typeof value === "number"
                    ? value
                    : Number.isFinite(Number(value))
                      ? Number(value)
                      : 0;
                return [`${safe.toLocaleString()}회`, key === "signups" ? "가입자" : "AI 요청"];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (value === "signups" ? "가입자" : "AI 요청")}
            />
            <Line
              type="monotone"
              dataKey="signups"
              stroke="#577BA5"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, fill: "#577BA5", stroke: "#ffffff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="aiRequests"
              stroke="#55C7E8"
              strokeWidth={2.4}
              dot={false}
              activeDot={{ r: 4, fill: "#55C7E8", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
