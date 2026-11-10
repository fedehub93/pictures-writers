import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// Kept in step with `src/shared/lib/db.ts`: a connection that is accepted but
// never answered must fail in seconds, not hang the caller forever, and the
// pool must stay small enough for a multi-worker `next build` to fit inside
// the server's `max_connections` (see the longer note there).
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
  max: 4,
});

const getPrisma = () => new PrismaClient({ adapter });

const globalForCmsPrisma = global as unknown as {
  cmsPrisma: ReturnType<typeof getPrisma>;
};

export const db = globalForCmsPrisma.cmsPrisma || getPrisma();

if (process.env.NODE_ENV !== "production") globalForCmsPrisma.cmsPrisma = db;
