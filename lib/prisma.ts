import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaDbUrlLogged: boolean | undefined;
};

function maskHost(host: string): string {
  if (!host) return "unknown";
  if (host.length <= 8) return host;
  return `${host.slice(0, 4)}...${host.slice(-4)}`;
}

function getConnectionFamily(host: string): "supabase-pooler" | "supabase-direct" | "other" {
  if (host.includes(".pooler.supabase.com")) return "supabase-pooler";
  if (host.includes(".supabase.co")) return "supabase-direct";
  return "other";
}

function getDbUrlDiagnostics(raw: string) {
  try {
    const parsed = new URL(raw);
    const sslmode = parsed.searchParams.get("sslmode");
    const pgbouncer = parsed.searchParams.get("pgbouncer");
    const connectionLimit = parsed.searchParams.get("connection_limit");

    return {
      ok: true as const,
      family: getConnectionFamily(parsed.hostname),
      host: maskHost(parsed.hostname),
      port: parsed.port || "(default)",
      hasSslmode: sslmode != null,
      sslmode: sslmode ?? "(none)",
      hasPgbouncer: pgbouncer != null,
      pgbouncer: pgbouncer ?? "(none)",
      hasConnectionLimit: connectionLimit != null,
      connectionLimit: connectionLimit ?? "(none)",
    };
  } catch {
    return {
      ok: false as const,
      family: "other" as const,
      host: "(invalid-url)",
      port: "(invalid-url)",
      hasSslmode: false,
      sslmode: "(invalid-url)",
      hasPgbouncer: false,
      pgbouncer: "(invalid-url)",
      hasConnectionLimit: false,
      connectionLimit: "(invalid-url)",
    };
  }
}

const adapter = new PrismaPg({
  connectionString,
});

const dbDiagnostics = getDbUrlDiagnostics(connectionString);
if (!globalForPrisma.prismaDbUrlLogged) {
  console.info("[db] Prisma datasource configured", dbDiagnostics);
  globalForPrisma.prismaDbUrlLogged = true;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

export function logPrismaDatasourceUsage(context: string) {
  console.info("[db] Prisma datasource usage", {
    context,
    family: dbDiagnostics.family,
    host: dbDiagnostics.host,
    port: dbDiagnostics.port,
  });
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
