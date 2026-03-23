import { prisma } from "@/lib/prisma";

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function getAdminKpis(now = new Date()) {
  const dayStart = startOfUtcDay(now);
  const weekStart = new Date(dayStart);
  weekStart.setUTCDate(dayStart.getUTCDate() - 6);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    todaySignups,
    weekSignups,
    monthSignups,
    todayAiRequests,
    weekAiRequests,
    monthAiRequests,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.aiRequestLog.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.aiRequestLog.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.aiRequestLog.count({ where: { createdAt: { gte: monthStart } } }),
  ]);

  return {
    todaySignups,
    weekSignups,
    monthSignups,
    todayAiRequests,
    weekAiRequests,
    monthAiRequests,
  };
}
