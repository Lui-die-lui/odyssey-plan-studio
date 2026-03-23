import { prisma } from "@/lib/prisma";

const AI_DRAFT_ENABLED_KEY = "AI_DRAFT_ENABLED";

export async function isAiDraftEnabled() {
  const config = await prisma.systemConfig.findUnique({
    where: { key: AI_DRAFT_ENABLED_KEY },
    select: { value: true },
  });
  if (!config) return true;
  return config.value !== "false";
}

export async function setAiDraftEnabled(enabled: boolean) {
  const value = enabled ? "true" : "false";
  await prisma.systemConfig.upsert({
    where: { key: AI_DRAFT_ENABLED_KEY },
    create: { key: AI_DRAFT_ENABLED_KEY, value },
    update: { value },
  });
  return enabled;
}

export async function getAdminUserAiState(limit = 50) {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      aiBlocked: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}
