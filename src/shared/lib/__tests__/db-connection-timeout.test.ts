import { createServer, type AddressInfo, type Server, type Socket } from "node:net";

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * A socket that is accepted and then never answered: the shape of a wedged
 * Docker port proxy, a stopped container, or an unreachable host. Postgres
 * never sends a byte, so only a client-side connect timeout can settle the
 * query. Without one the first query stays pending forever and callers such as
 * `next build` hang with no output (see `db.ts`).
 */
let server: Server;
let port: number;
const sockets = new Set<Socket>();

beforeAll(async () => {
  server = createServer((socket) => {
    // Accept the connection and deliberately never reply.
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  port = (server.address() as AddressInfo).port;
});

afterEach(() => {
  delete (global as { cmsPrisma?: unknown }).cmsPrisma;
  vi.resetModules();
  vi.unstubAllEnvs();
});

afterAll(async () => {
  for (const socket of sockets) socket.destroy();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

describe("database connection timeout", () => {
  it("rejects instead of hanging when the connection is never answered", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      `postgresql://postgres:postgres@127.0.0.1:${port}/pictures_writers`,
    );

    const startedAt = Date.now();
    const { db } = await import("@/shared/lib/db");

    await expect(db.$queryRaw`select 1`).rejects.toThrow();

    // `connectionTimeoutMillis` in db.ts is 5s. The point of the assertion is
    // that the query settles at all: without the timeout it stays pending
    // until the test itself times out.
    expect(Date.now() - startedAt).toBeLessThan(15_000);

    await db.$disconnect();
  });
});
