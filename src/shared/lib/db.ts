import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const getPrisma = () => new PrismaClient({ adapter });

const globalForCmsPrisma = global as unknown as {
  cmsPrisma: ReturnType<typeof getPrisma>;
};

export const db = globalForCmsPrisma.cmsPrisma || getPrisma();

if (process.env.NODE_ENV !== "production") globalForCmsPrisma.cmsPrisma = db;
