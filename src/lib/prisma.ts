import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

// In development with hot-reloading, if schema models changed, refresh stale singleton
if (
    globalForPrisma.prisma &&
    (!("customer" in globalForPrisma.prisma) || !("saleTransaction" in globalForPrisma.prisma))
) {
    globalForPrisma.prisma = undefined;
}

export const prisma =
    globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}