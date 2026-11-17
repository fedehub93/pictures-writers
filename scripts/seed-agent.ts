/**
 * Seed the agent database: an admin probe user, one page the browser probe can drive,
 * and one published post.
 *
 *   npm run agent:seed
 *
 * Idempotent and it doubles as the probe's reset: the page content is rewritten from the
 * fixture on every run, so a probe that typed into the canvas starts from a known state.
 *
 * The published post is not for the probe: `/blog` reads `posts[0]` without a guard, so a
 * database with no published post cannot prerender. Without it `next build` only runs
 * against the development database, which is exactly what the agent database exists to
 * avoid.
 *
 * The script only writes to `pictures_writers_agent` on localhost. That guard is the point:
 * the development database can hold a restored production dump, and a seed that ran there
 * would create accounts and pages next to real data.
 */

import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { hashPassword } from "better-auth/crypto";

import { ContentStatus } from "@/generated/prisma";
import { createPage } from "@/modules/pages/server/create-page";
import { db } from "@/shared/lib/db";

const AGENT_DATABASE = "pictures_writers_agent";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

const PROBE_SLUG = "probe";
const PROBE_TITLE = "Probe page";
const PROBE_HEADING_TEXT = "<p>Probe heading</p>";
const PROBE_PARAGRAPH_TEXT = "<p>Probe paragraph</p>";

/** The two blocks every probe flow starts from: one `Heading`, one `Text`. */
const PROBE_PUCK_DATA: PrismaJson.PuckData = {
  root: {},
  content: [
    {
      type: "Heading",
      props: { id: "probe-heading", text: PROBE_HEADING_TEXT, level: "h2" },
    },
    {
      type: "Text",
      props: { id: "probe-text", text: PROBE_PARAGRAPH_TEXT },
    },
  ],
  zones: {},
};

const PROBE_POST_SLUG = "blog/probe-post";
const PROBE_POST_TITLE = "Probe post";
const PROBE_POST_TEXT = "Probe post body";

/** The smallest TipTap document the renderer accepts, matching the test fixture shape. */
const PROBE_POST_BODY: PrismaJson.TipTapBodyData = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: PROBE_POST_TEXT }] }],
};

function assertAgentDatabase() {
  const raw = process.env.DATABASE_URL;

  if (!raw) {
    throw new Error("DATABASE_URL is not set. Run this through npm run agent:seed.");
  }

  const url = new URL(raw);
  const database = url.pathname.replace(/^\//, "");

  if (!LOCAL_HOSTS.has(url.hostname) || database !== AGENT_DATABASE) {
    throw new Error(
      `Refusing to seed ${url.hostname}/${database}: this script writes only to ${AGENT_DATABASE} on localhost.`,
    );
  }
}

async function upsertProbeUser() {
  const email = process.env.PROBE_ADMIN_EMAIL;
  const password = process.env.PROBE_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("PROBE_ADMIN_EMAIL and PROBE_ADMIN_PASSWORD must be set in .env.agent.");
  }

  const adminRole = await db.role.findUnique({ where: { key: "ADMIN" } });

  if (!adminRole) {
    throw new Error("The ADMIN role is missing; run prisma migrate deploy against the agent database.");
  }

  const existing = await db.user.findUnique({ where: { email } });

  const user =
    existing ??
    (await db.user.create({
      data: {
        id: randomUUID(),
        name: "Probe user",
        email,
        emailVerified: true,
        role: "ADMIN",
        roleId: adminRole.id,
        accountStatus: "ACTIVE",
      },
    }));

  if (existing) {
    await db.user.update({
      where: { id: user.id },
      data: { role: "ADMIN", roleId: adminRole.id, accountStatus: "ACTIVE", emailVerified: true },
    });
  }

  const passwordHash = await hashPassword(password);

  await db.account.upsert({
    where: {
      issuer_accountId: { issuer: "local:credential", accountId: user.id },
    },
    create: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      issuer: "local:credential",
      password: passwordHash,
    },
    update: { password: passwordHash },
  });

  return user;
}

async function upsertProbePage(userId: string) {
  const existing = await db.pageRoot.findUnique({
    where: { slug: PROBE_SLUG },
    include: { currentVersion: true },
  });

  if (!existing) {
    const created = await createPage({ title: PROBE_TITLE, slug: PROBE_SLUG, userId });

    await db.pageVersion.update({
      where: { id: created.id },
      data: { puckData: PROBE_PUCK_DATA, title: PROBE_TITLE },
    });

    return created.rootId;
  }

  if (!existing.currentVersion) {
    const version = await db.pageVersion.create({
      data: {
        rootId: existing.id,
        version: 1,
        title: PROBE_TITLE,
        puckData: PROBE_PUCK_DATA,
        userId,
      },
    });

    await db.pageRoot.update({
      where: { id: existing.id },
      data: { currentVersionId: version.id },
    });

    return existing.id;
  }

  await db.pageVersion.update({
    where: { id: existing.currentVersion.id },
    data: { puckData: PROBE_PUCK_DATA, title: PROBE_TITLE },
  });

  return existing.id;
}

/** Create the single published version the static build needs, plus its author edge. */
async function createProbePostVersion(rootId: string, userId: string) {
  return db.postVersion.create({
    data: {
      rootId,
      version: 1,
      title: PROBE_POST_TITLE,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      tiptapBodyData: PROBE_POST_BODY,
      userId,
      authors: { create: [{ userId, sort: 0 }] },
    },
  });
}

async function upsertProbePost(userId: string) {
  const existing = await db.postRoot.findUnique({
    where: { slug: PROBE_POST_SLUG },
    include: { currentVersion: true, liveVersion: true },
  });

  if (!existing) {
    const root = await db.postRoot.create({
      data: { slug: PROBE_POST_SLUG, firstPublishedAt: new Date() },
    });

    const version = await createProbePostVersion(root.id, userId);

    await db.postRoot.update({
      where: { id: root.id },
      data: { currentVersionId: version.id, liveVersionId: version.id },
    });

    return root.id;
  }

  const liveVersionId = existing.liveVersionId ?? existing.currentVersionId;

  if (!liveVersionId) {
    const version = await createProbePostVersion(existing.id, userId);

    await db.postRoot.update({
      where: { id: existing.id },
      data: {
        currentVersionId: version.id,
        liveVersionId: version.id,
        firstPublishedAt: existing.firstPublishedAt ?? new Date(),
      },
    });

    return existing.id;
  }

  await db.postVersion.update({
    where: { id: liveVersionId },
    data: {
      title: PROBE_POST_TITLE,
      status: ContentStatus.PUBLISHED,
      publishedAt: existing.liveVersion?.publishedAt ?? new Date(),
      tiptapBodyData: PROBE_POST_BODY,
    },
  });

  await db.postAuthor.upsert({
    where: { postId_userId: { postId: liveVersionId, userId } },
    create: { postId: liveVersionId, userId, sort: 0 },
    update: {},
  });

  await db.postRoot.update({
    where: { id: existing.id },
    data: {
      currentVersionId: existing.currentVersionId ?? liveVersionId,
      liveVersionId,
      firstPublishedAt: existing.firstPublishedAt ?? new Date(),
    },
  });

  return existing.id;
}

/** Keep `PROBE_PAGE_ROOT_ID` in step with the database, so the probe needs no Prisma import. */
function writePageRootId(rootId: string) {
  const path = resolve(process.env.AGENT_ENV_FILE ?? ".env.agent");
  const current = readFileSync(path, "utf8");
  const line = `PROBE_PAGE_ROOT_ID=${rootId}`;
  const next = /^PROBE_PAGE_ROOT_ID=.*$/m.test(current)
    ? current.replace(/^PROBE_PAGE_ROOT_ID=.*$/m, line)
    : `${current.trimEnd()}\n${line}\n`;

  writeFileSync(path, next, "utf8");
}

async function main() {
  assertAgentDatabase();

  const user = await upsertProbeUser();
  const rootId = await upsertProbePage(user.id);
  const postRootId = await upsertProbePost(user.id);

  writePageRootId(rootId);

  console.log(`probe user: ${user.email}`);
  console.log(`probe page: /${PROBE_SLUG} (${rootId})`);
  console.log(`probe post: /${PROBE_POST_SLUG} (${postRootId})`);
  console.log("builder URL: /admin/pages/" + rootId + "/builder/");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
