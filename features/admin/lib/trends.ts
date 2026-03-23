import { prisma } from "@/lib/prisma";

export type TrendGranularity = "day" | "week" | "month";

export type TrendPoint = {
  label: string;
  signups: number;
  aiRequests: number;
};

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function startOfUtcWeek(d: Date) {
  const day = startOfUtcDay(d);
  const weekday = (day.getUTCDay() + 6) % 7; // Monday=0
  day.setUTCDate(day.getUTCDate() - weekday);
  return day;
}

function startOfUtcMonth(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function keyFor(date: Date, granularity: TrendGranularity) {
  if (granularity === "day") {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
      date.getUTCDate(),
    ).padStart(2, "0")}`;
  }
  if (granularity === "week") {
    const w = startOfUtcWeek(date);
    return `${w.getUTCFullYear()}-W${String(Math.ceil((w.getUTCDate() + 6) / 7)).padStart(2, "0")}-${String(
      w.getUTCMonth() + 1,
    ).padStart(2, "0")}-${String(w.getUTCDate()).padStart(2, "0")}`;
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function labelFor(date: Date, granularity: TrendGranularity) {
  if (granularity === "day") {
    return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
  }
  if (granularity === "week") {
    const start = startOfUtcWeek(date);
    return `${String(start.getUTCMonth() + 1).padStart(2, "0")}/${String(start.getUTCDate()).padStart(2, "0")} 주`;
  }
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildBuckets(granularity: TrendGranularity, now = new Date()) {
  const buckets: { start: Date; key: string; label: string }[] = [];
  const length = granularity === "day" ? 14 : 12;

  for (let i = length - 1; i >= 0; i -= 1) {
    let start: Date;
    if (granularity === "day") {
      start = startOfUtcDay(now);
      start.setUTCDate(start.getUTCDate() - i);
    } else if (granularity === "week") {
      start = startOfUtcWeek(now);
      start.setUTCDate(start.getUTCDate() - i * 7);
    } else {
      start = startOfUtcMonth(now);
      start.setUTCMonth(start.getUTCMonth() - i);
    }
    buckets.push({ start, key: keyFor(start, granularity), label: labelFor(start, granularity) });
  }
  return buckets;
}

export async function getTrendSeries(granularity: TrendGranularity) {
  const buckets = buildBuckets(granularity);
  const from = buckets[0]?.start ?? new Date();

  const [users, requests] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
    prisma.aiRequestLog.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
  ]);

  const map = new Map<string, TrendPoint>();
  for (const b of buckets) {
    map.set(b.key, { label: b.label, signups: 0, aiRequests: 0 });
  }

  for (const u of users) {
    const key = keyFor(u.createdAt, granularity);
    const row = map.get(key);
    if (row) row.signups += 1;
  }

  for (const r of requests) {
    const key = keyFor(r.createdAt, granularity);
    const row = map.get(key);
    if (row) row.aiRequests += 1;
  }

  return Array.from(map.values());
}
