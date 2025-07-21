import { PrismaClient } from "@prisma/client";

const getPrisma = () => new PrismaClient();

const globalForCmsPrisma = global as unknown as {
  cmsPrisma: ReturnType<typeof getPrisma>;
};

export const db = globalForCmsPrisma.cmsPrisma || getPrisma();

if (process.env.NODE_ENV !== "production") globalForCmsPrisma.cmsPrisma = db;
