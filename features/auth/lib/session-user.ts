import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth/lib/auth";
import { prisma } from "@/lib/prisma";

export type ActiveSessionUser = {
  id: string;
  role: "USER" | "ADMIN";
};

/**
 * Resolves the signed-in user from the DB rather than the JWT, so withdrawal
 * and role changes apply immediately instead of when the token expires.
 * Returns null for guests, deleted users, and users pending deletion.
 */
export async function getActiveSessionUser(): Promise<ActiveSessionUser | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (typeof userId !== "string" || !userId.length) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!user || user.status !== "ACTIVE") return null;

  return { id: user.id, role: user.role };
}
