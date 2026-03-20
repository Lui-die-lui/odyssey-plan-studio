// import { PrismaClient } from "@prisma/client";

// // Avoid creating multiple PrismaClient instances during development hot reloads.
// declare global {
//   // eslint-disable-next-line no-var
//   var prisma: PrismaClient | undefined;
// }

// const prisma =
//   globalThis.prisma ??
//   new PrismaClient({
//     log: process.env.NODE_ENV === "production" ? [] : ["query", "info", "warn"],
//   });

// if (process.env.NODE_ENV !== "production") {
//   globalThis.prisma = prisma;
// }

// export { prisma };
// export default prisma;

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}