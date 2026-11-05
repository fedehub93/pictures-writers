import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
// exercised against the test database without a session.
vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { createCallerFactory } from "@/trpc/init";
import { revalidatePath } from "next/cache";

import type { Data } from "@puckeditor/core";

import { ContentStatus } from "@/generated/prisma";
import type { HydratedComponents } from "@/puck/config";
import { db } from "@/shared/lib/db";

import {
  getLiveRegionByKey,
  getRegionWithVersions,
} from "../queries";
import { siteRegionsRouter } from "../procedures";

const createCaller = createCallerFactory(siteRegionsRouter);

const userIds: string[] = [];
const formIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let currentUserId: string;

beforeEach(async () => {
  userIds.length = 0;
  formIds.length = 0;
  vi.clearAllMocks();

  // Region keys are unique per Installation, so each test starts from a clean
  // slate. This runs against the disposable test database only.
  await db.siteRegion.deleteMany({});

  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  currentUserId = user.id;
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  await db.siteRegion.deleteMany({});
  if (formIds.length > 0) {
    await db.form.deleteMany({ where: { id: { in: formIds } } });
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  userIds.length = 0;
  formIds.length = 0;
});

async function createRegion(key: "HEADER" | "FOOTER" = "HEADER") {
  return caller.create({ key });
}

function puckDataWithForm(formId: string): Data<HydratedComponents> {
  return {
    root: {},
    content: [
      {
        type: "Form",
        props: {
          id: `form-block-${randomUUID()}`,
          form: { id: formId },
        },
      },
    ],
  } as unknown as Data<HydratedComponents>;
}

describe("siteRegionsRouter create", () => {
  it("creates a root with an initial DRAFT version", async () => {
    const created = await createRegion();

    expect(created.key).toBe("HEADER");
    expect(created.version).toBe(1);
    expect(created.status).toBe(ContentStatus.DRAFT);
    expect(created.userId).toBe(currentUserId);

    const root = await db.siteRegion.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.key).toBe("HEADER");
    expect(root.currentVersionId).toBe(created.id);
    expect(root.liveVersionId).toBeNull();

    const versions = await db.siteRegionVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versions).toHaveLength(1);
  });

  it("is idempotent and returns the current version on a second call", async () => {
    const first = await createRegion("FOOTER");
    const second = await createRegion("FOOTER");

    expect(second.id).toBe(first.id);
    expect(second.rootId).toBe(first.rootId);

    const roots = await db.siteRegion.findMany({ where: { key: "FOOTER" } });
    expect(roots).toHaveLength(1);

    const versions = await db.siteRegionVersion.findMany({
      where: { rootId: first.rootId },
    });
    expect(versions).toHaveLength(1);
  });
});

describe("siteRegionsRouter getCurrent", () => {
  it("returns null when the region does not exist", async () => {
    await expect(caller.getCurrent({ key: "HEADER" })).resolves.toBeNull();
  });

  it("returns the current editable version", async () => {
    const created = await createRegion();

    const current = await caller.getCurrent({ key: "HEADER" });

    expect(current).not.toBeNull();
    expect(current!.id).toBe(created.id);
    expect(current!.key).toBe("HEADER");
    expect(current!.status).toBe(ContentStatus.DRAFT);
  });

  it("returns the forked version after editing a published region", async () => {
    const created = await createRegion();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    const current = await caller.getCurrent({ key: "HEADER" });

    expect(current!.id).toBe(forked.id);
    expect(current!.status).toBe(ContentStatus.CHANGED);
  });
});

describe("siteRegionsRouter update", () => {
  it("updates a draft in place", async () => {
    const created = await createRegion();

    const updated = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    expect(updated.id).toBe(created.id);

    const versions = await db.siteRegionVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versions).toHaveLength(1);
    expect(versions[0]!.version).toBe(1);
    expect(versions[0]!.status).toBe(ContentStatus.DRAFT);
  });

  it("forks a CHANGED version when editing the live version", async () => {
    const created = await createRegion();
    const published = await caller.publish({
      id: created.id,
      rootId: created.rootId,
    });

    const updated = await caller.update({
      id: published.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    expect(updated.id).not.toBe(created.id);
    expect(updated.version).toBe(2);
    expect(updated.status).toBe(ContentStatus.CHANGED);

    const root = await db.siteRegion.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.currentVersionId).toBe(updated.id);
    expect(root.liveVersionId).toBe(created.id);

    const live = await db.siteRegionVersion.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(live.status).toBe(ContentStatus.PUBLISHED);
  });

  it("keeps editing the forked version in place", async () => {
    const created = await createRegion();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    const second = await caller.update({
      id: forked.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    expect(second.id).toBe(forked.id);

    const versions = await db.siteRegionVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versions).toHaveLength(2);
  });

  it("dehydrates forms before storing", async () => {
    const created = await createRegion();

    const saved = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: puckDataWithForm(randomUUID()),
    });

    const stored = await db.siteRegionVersion.findUniqueOrThrow({
      where: { id: saved.id },
    });
    const document = stored.puckData as unknown as {
      content: Array<{ props: { form: Record<string, unknown> } }>;
    };
    const form = document.content[0]!.props.form;

    expect(form.id).toBeDefined();
    expect(form.content).toBeUndefined();
    expect(form.gtmEventName).toBeUndefined();
  });

  it("rejects an edit to an older, non-current version", async () => {
    const created = await createRegion();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    await expect(
      caller.update({
        id: created.id,
        rootId: created.rootId,
        puckData: { root: {}, content: [] },
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const root = await db.siteRegion.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.currentVersionId).toBe(forked.id);
  });

  it("throws NOT_FOUND for an unknown version", async () => {
    await expect(
      caller.update({
        id: randomUUID(),
        rootId: randomUUID(),
        puckData: { root: {}, content: [] },
      }),
    ).rejects.toThrow();
  });
});

describe("siteRegionsRouter publish", () => {
  it("promotes the version to live and revalidates the layout", async () => {
    const created = await createRegion();

    const published = await caller.publish({
      id: created.id,
      rootId: created.rootId,
    });

    expect(published.status).toBe(ContentStatus.PUBLISHED);
    expect(published.publishedAt).toBeInstanceOf(Date);
    expect(published.key).toBe("HEADER");

    const root = await db.siteRegion.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBe(created.id);
    expect(root.firstPublishedAt).toBeInstanceOf(Date);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("demotes the previous live version when publishing a fork", async () => {
    const created = await createRegion();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    await caller.publish({ id: forked.id, rootId: created.rootId });

    const previous = await db.siteRegionVersion.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(previous.status).toBe(ContentStatus.CHANGED);

    const root = await db.siteRegion.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBe(forked.id);
  });

  it("sets firstPublishedAt only on the first publication", async () => {
    const created = await createRegion();
    const first = await caller.publish({
      id: created.id,
      rootId: created.rootId,
    });
    const rootAfterFirst = await db.siteRegion.findUniqueOrThrow({
      where: { id: created.rootId },
    });

    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });
    const second = await caller.publish({
      id: forked.id,
      rootId: created.rootId,
    });
    const rootAfterSecond = await db.siteRegion.findUniqueOrThrow({
      where: { id: created.rootId },
    });

    expect(rootAfterSecond.firstPublishedAt?.toISOString()).toBe(
      rootAfterFirst.firstPublishedAt?.toISOString(),
    );
    expect(second.publishedAt?.toISOString()).not.toBe(
      first.publishedAt?.toISOString(),
    );
  });

  it("throws NOT_FOUND for an unknown version", async () => {
    await expect(
      caller.publish({ id: randomUUID(), rootId: randomUUID() }),
    ).rejects.toThrow();
  });
});

describe("siteRegionsRouter unpublish", () => {
  it("clears the live version and moves it back to CHANGED", async () => {
    const created = await createRegion();
    await caller.publish({ id: created.id, rootId: created.rootId });

    const result = await caller.unpublish({ key: "HEADER" });

    expect(result.liveVersionId).toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");

    const root = await db.siteRegion.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBeNull();

    const version = await db.siteRegionVersion.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(version.status).toBe(ContentStatus.CHANGED);
  });

  it("is a no-op when no version is live", async () => {
    const created = await createRegion();

    const result = await caller.unpublish({ key: "HEADER" });

    expect(result.id).toBe(created.rootId);
    expect(result.liveVersionId).toBeNull();
  });

  it("throws NOT_FOUND for an unknown region", async () => {
    await expect(caller.unpublish({ key: "FOOTER" })).rejects.toThrow();
  });
});

describe("site region reads", () => {
  it("getByKey returns null until a version is published", async () => {
    const created = await createRegion();

    await expect(caller.getByKey({ key: "HEADER" })).resolves.toBeNull();
    await expect(getLiveRegionByKey("HEADER")).resolves.toBeNull();

    await caller.publish({ id: created.id, rootId: created.rootId });

    const live = await caller.getByKey({ key: "HEADER" });
    expect(live).not.toBeNull();
    expect(live!.id).toBe(created.id);
  });

  it("getByKey keeps serving the live version after an edit", async () => {
    const created = await createRegion();
    await caller.publish({ id: created.id, rootId: created.rootId });
    await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    const live = await caller.getByKey({ key: "HEADER" });

    expect(live!.id).toBe(created.id);
    expect(live!.status).toBe(ContentStatus.PUBLISHED);
  });

  it("getByKey hydrates form blocks from the database", async () => {
    const form = await db.form.create({
      data: {
        name: `Form ${randomUUID()}`,
        content: { fields: [] } as unknown as PrismaJson.FormContentState,
      },
    });
    formIds.push(form.id);

    const created = await createRegion();
    await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: puckDataWithForm(form.id),
    });
    await caller.publish({ id: created.id, rootId: created.rootId });

    const live = await caller.getByKey({ key: "HEADER" });
    const document = live!.puckData as unknown as {
      content: Array<{ props: { form: { id: string; content?: unknown } } }>;
    };

    expect(document.content[0]!.props.form.id).toBe(form.id);
    expect(document.content[0]!.props.form.content).toEqual({ fields: [] });
  });

  it("getVersions lists the history newest first", async () => {
    const created = await createRegion();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    const versions = await caller.getVersions({ key: "HEADER" });

    expect(versions.map((version) => version.id)).toEqual([
      forked.id,
      created.id,
    ]);
    expect(versions.map((version) => version.version)).toEqual([2, 1]);

    await expect(caller.getVersions({ key: "FOOTER" })).resolves.toEqual([]);
  });

  it("getRegionWithVersions returns the root, current version and history", async () => {
    const created = await createRegion();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      puckData: { root: {}, content: [] },
    });

    const region = await getRegionWithVersions("HEADER");

    expect(region).not.toBeNull();
    expect(region!.key).toBe("HEADER");
    expect(region!.currentVersionId).toBe(forked.id);
    expect(region!.liveVersionId).toBe(created.id);
    expect(region!.currentVersion?.id).toBe(forked.id);
    expect(region!.currentVersion?.puckData).toBeTruthy();
    expect(region!.liveVersion?.id).toBe(created.id);
    expect(region!.versions.map((version) => version.id)).toEqual([
      forked.id,
      created.id,
    ]);

    await expect(getRegionWithVersions("FOOTER")).resolves.toBeNull();
  });
});
