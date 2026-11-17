import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

// `connectionTimeoutMillis` is not optional in spirit: without it a TCP
// connection that is accepted but never answered (a stopped container, a
// black-holing proxy, an unreachable host) keeps the first query pending
// forever, and processes such as `next build` hang with no output instead of
// failing. Five seconds matches the connect timeout of Prisma's own engine.
//
// `max` is deliberately small. A build prerenders one worker per CPU and each
// worker imports both `db.ts` modules, so the per-pool cap is multiplied by
// roughly 2 x CPU count: with `pg`'s default of 10, a 19-worker build asks for
// ~380 connections and dies with P2037 — in Coolify too, where the build runs
// against the production database from the app container. Four keeps the build
// comfortably inside the server limit and leaves a server process a pool of
// eight. If the application ever needs more concurrency, raise this together
// with `max_connections`, not on its own: `connectionTimeoutMillis` also bounds
// the wait for a free client, so a saturated pool fails with "timeout expired"
// rather than queueing forever.
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
