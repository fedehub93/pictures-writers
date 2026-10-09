import { randomUUID } from "node:crypto";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

import { emptyTiptapDoc } from "./fixtures";

/**
 * Test helpers for building `PostRoot` / `PostVersion` fixtures directly,
 * bypassing the router when a suite only needs a given shape (e.g. one
 * published version plus a staged `CHANGED` one). Deleting the root cascades
 * its versions; scheduled actions must be cleaned up separately because their
 * `targetId` is a plain string.
 */
export interface VersionOptions {
  title?: string;
  status?: ContentStatus;
  version?: number;
  scheduledAt?: Date | null;
  preSchedulingStatus?: ContentStatus | null;
  publishedAt?: Date | null;
}

export interface CreatePostRootOptions {
  slug?: string;
  firstPublishedAt?: Date | null;
  version?: VersionOptions;
}

async function nextVersion(rootId: string): Promise<number> {
  const latest = await db.postVersion.aggregate({
    where: { rootId },
    _max: { version: true },
  });

  return (latest._max.version ?? 0) + 1;
}

export async function addPostVersion(
  rootId: string,
  options: VersionOptions = {},
) {
  return db.postVersion.create({
    data: {
      rootId,
      version: options.version ?? (await nextVersion(rootId)),
      status: options.status ?? ContentStatus.DRAFT,
      title: options.title ?? "Test Post",
      tiptapBodyData: emptyTiptapDoc,
      scheduledAt: options.scheduledAt ?? null,
      preSchedulingStatus: options.preSchedulingStatus ?? null,
      publishedAt: options.publishedAt ?? null,
    },
  });
}

export async function makeCurrent(
  rootId: string,
  versionId: string,
  { live = false }: { live?: boolean } = {},
) {
  await db.postRoot.update({
    where: { id: rootId },
    data: {
      currentVersionId: versionId,
      ...(live ? { liveVersionId: versionId } : {}),
    },
  });
}

export async function createPostRoot({
  slug = `post-${randomUUID()}`,
  firstPublishedAt = null,
  version = {},
}: CreatePostRootOptions = {}) {
  const root = await db.postRoot.create({
    data: { slug, firstPublishedAt },
  });

  const postVersion = await addPostVersion(root.id, version);

  await makeCurrent(root.id, postVersion.id, {
    live: postVersion.status === ContentStatus.PUBLISHED,
  });

  return { rootId: root.id, slug, version: postVersion };
}

export interface SeedPostOptions extends VersionOptions {
  slug?: string;
  firstPublishedAt?: Date | null;
}

/**
 * Flat-options sugar over `createPostRoot`, so suites that seed a post from a
 * single override object don't each re-map the fields.
 */
export async function seedPost({
  slug,
  firstPublishedAt,
  ...version
}: SeedPostOptions = {}) {
  return createPostRoot({ slug, firstPublishedAt, version });
}
