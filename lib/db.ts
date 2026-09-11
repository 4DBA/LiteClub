import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaWalConfigured?: boolean;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * Configure SQLite PRAGMAs per PRD specification:
 * 1. PRAGMA journal_mode=WAL;
 * 2. PRAGMA busy_timeout=5000;
 * 3. PRAGMA synchronous=NORMAL;
 * 4. PRAGMA foreign_keys=ON;
 */
export async function configureSqlitePragmas() {
  if (globalForPrisma.prismaWalConfigured) {
    return;
  }
  try {
    await db.$queryRawUnsafe("PRAGMA journal_mode=WAL;");
    await db.$queryRawUnsafe("PRAGMA busy_timeout=5000;");
    await db.$queryRawUnsafe("PRAGMA synchronous=NORMAL;");
    await db.$queryRawUnsafe("PRAGMA foreign_keys=ON;");
    globalForPrisma.prismaWalConfigured = true;
  } catch (error) {
    console.error("Failed to execute SQLite PRAGMAs:", error);
  }
}
