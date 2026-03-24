import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;
const allowInsecureDevSsl =
  process.env.NODE_ENV !== "production" &&
  process.env.DEV_DB_SSL_REJECT_UNAUTHORIZED === "false";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString,
  ...(allowInsecureDevSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
