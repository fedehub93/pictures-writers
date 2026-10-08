import "server-only";

import { ContentStatus, Prisma, type PostVersion } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { PostUpdateValues } from "../schemas";

import { PostError } from "./errors";
import { acquireRootLock } from "./lock-root-posts";
import { clonePostSeo } from "./post-seo";

export interface PostVersionWithSlug extends PostVersion {
  slug: string;
}

export type CurrentVersion = Prisma.PostVersionGetPayload<{
  include: { categories: true; tags: true; authors: true; faqs: true };
}>;

/**
 * Persist an edit to the current revision of a Post root.
 *
 * - When the current revision is not live, it is updated in place: a draft
 *   stays a single row while the editor iterates.
 * - When the current revision is live, the edit forks a new `CHANGED` revision
 *   so the live site keeps serving the published version until the change is
 *   published. The fork copies the live revision's content, editorial relations
 *   and a self-owned SEO row.
 *
 * The `PostRoot` row is locked for the duration so a concurrent publish or edit
 * cannot interleave between reading the live pointer and forking.
 */
export async function savePostVersion(
  input: PostUpdateValues,
): Promise<PostVersionWithSlug> {
  const { id, rootId } = input;

  if (!id || !rootId) {
    throw new PostError("NOT_FOUND", "Post not found");
  }

  return db.$transaction(async (tx) => {
    await acquireRootLock(tx, rootId);

    const root = await tx.postRoot.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new PostError("NOT_FOUND", "Post not found");
    }

    const current = await tx.postVersion.findFirst({
      where: { id, rootId },
      include: { categories: true, tags: true, authors: true, faqs: true },
    });
    if (!current) {
      throw new PostError("NOT_FOUND", "Post not found");
    }

    const title = input.title ?? current.title;
    const slug = input.slug ?? root.slug;

    if (root.liveVersionId === current.id) {
      const seoId =
        input.seoId !== undefined
          ? input.seoId
          : await cloneSeoForFork(tx, current);

      return forkPostVersion(tx, {
        root,
        current,
        input,
        title,
        slug,
        seoId,
      });
    }

    return updateInPlace(tx, { root, current, input, title, slug });
  });
}

export interface ForkPostVersionInput {
  root: { id: string; slug: string };
  current: CurrentVersion;
  input: PostUpdateValues;
  title: string;
  slug: string;
  seoId: string | null;
}

/**
 * Create a new `CHANGED` revision from a live one, carrying the content, the
 * editorial relations (or the caller's replacements) and the given SEO. Used by
 * both the content edit and the SEO edit paths so a staged change always forks
 * the same way. The caller must hold the root lock.
 */
export async function forkPostVersion(
  tx: Prisma.TransactionClient,
  { root, current, input, title, slug, seoId }: ForkPostVersionInput,
): Promise<PostVersionWithSlug> {
  const latest = await tx.postVersion.aggregate({
    where: { rootId: root.id },
    _max: { version: true },
  });

  const forked = await tx.postVersion.create({
    data: {
      rootId: root.id,
      version: (latest._max.version ?? 0) + 1,
      status: ContentStatus.CHANGED,
      title,
      description:
        input.description !== undefined
          ? input.description
          : current.description,
      bodyData: current.bodyData as Prisma.InputJsonValue | undefined,
      tiptapBodyData:
        input.tiptapBodyData ?? current.tiptapBodyData ?? undefined,
      imageCoverId:
        input.imageCoverId !== undefined
          ? input.imageCoverId
          : current.imageCoverId,
      seoId,
      userId: current.userId,
      categories: { create: categoriesToCreate(input, current) },
      tags: { connect: tagsToConnect(input, current) },
      authors: { create: authorsToCreate(input, current) },
      faqs: { create: faqsToCreate(input, current) },
    },
  });

  await tx.postRoot.update({
    where: { id: root.id },
    data: { currentVersionId: forked.id, slug },
  });

  return { ...forked, slug };
}

interface MutateContext {
  root: { id: string; slug: string };
  current: CurrentVersion;
  input: PostUpdateValues;
  title: string;
  slug: string;
}

/**
 * Update a non-live current revision in place. Relation edits only run when the
 * caller supplies them, so an isolated title edit never clears authors, tags,
 * categories or FAQs.
 */
async function updateInPlace(
  tx: Prisma.TransactionClient,
  { root, current, input, title, slug }: MutateContext,
): Promise<PostVersionWithSlug> {
  const updated = await tx.postVersion.update({
    where: { id: current.id },
    data: {
      title,
      ...(input.description !== undefined && { description: input.description }),
      ...(input.tiptapBodyData !== undefined && {
        tiptapBodyData: input.tiptapBodyData,
      }),
      ...(input.imageCoverId !== undefined && {
        imageCoverId: input.imageCoverId,
      }),
      ...(input.seoId !== undefined && { seoId: input.seoId }),
      ...(input.categories && {
        categories: {
          deleteMany: {},
          create: input.categories.map((category) => ({
            categoryId: category.id,
            sort: category.sort,
          })),
        },
      }),
      ...(input.tags && {
        tags: { set: input.tags.map((tag) => ({ id: tag.id })) },
      }),
      ...(input.authors && {
        authors: {
          deleteMany: {},
          create: input.authors.map((author) => ({
            userId: author.id,
            sort: author.sort,
          })),
        },
      }),
      ...(input.faqs && {
        faqs: {
          deleteMany: {},
          create: input.faqs.map((faq) => ({
            question: faq.question ?? "",
            answer: faq.answer ?? "",
            sort: faq.sort,
          })),
        },
      }),
    },
  });

  if (slug !== root.slug) {
    await tx.postRoot.update({ where: { id: root.id }, data: { slug } });
  }

  return { ...updated, slug };
}

async function cloneSeoForFork(
  tx: Prisma.TransactionClient,
  current: CurrentVersion,
): Promise<string | null> {
  if (!current.seoId) return null;

  const clone = await clonePostSeo(tx, current.seoId, {});
  return clone?.id ?? null;
}

function categoriesToCreate(input: PostUpdateValues, current: CurrentVersion) {
  return input.categories
    ? input.categories.map((category) => ({
        categoryId: category.id,
        sort: category.sort,
      }))
    : current.categories.map((category) => ({
        categoryId: category.categoryId,
        sort: category.sort,
      }));
}

function tagsToConnect(input: PostUpdateValues, current: CurrentVersion) {
  return input.tags
    ? input.tags.map((tag) => ({ id: tag.id }))
    : current.tags.map((tag) => ({ id: tag.id }));
}

function authorsToCreate(input: PostUpdateValues, current: CurrentVersion) {
  return input.authors
    ? input.authors.map((author) => ({ userId: author.id, sort: author.sort }))
    : current.authors.map((author) => ({
        userId: author.userId,
        sort: author.sort,
      }));
}

function faqsToCreate(input: PostUpdateValues, current: CurrentVersion) {
  return input.faqs
    ? input.faqs.map((faq) => ({
        question: faq.question ?? "",
        answer: faq.answer ?? "",
        sort: faq.sort,
      }))
    : current.faqs.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
        sort: faq.sort,
      }));
}
