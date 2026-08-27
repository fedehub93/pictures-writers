import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";
import type { PostUpdateValues } from "../schemas";

export const createNewVersion = async (input: Partial<PostUpdateValues>) => {
  // 1. Recupero la versione corrente (rimosso il filtro su PUBLISHED)
  const latestPost = await db.post.findFirst({
    where: {
      rootId: input.rootId,
    },
    include: {
      tags: true,
      postCategories: true,
      postAuthors: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestPost) {
    throw new Error("POST_NOT_FOUND");
  }

  // 2. Separo i dati relazionali dall'input
  const {
    tags: inputTags,
    categories: inputCategories,
    authors: inputAuthors,
    ...inputData
  } = input;

  // ============================================================================
  // BRANCH A: IL POST È PUBBLICATO -> CREO UNA NUOVA VERSIONE (Stato: CHANGED)
  // ============================================================================
  if (latestPost.status === ContentStatus.PUBLISHED) {
    const {
      id,
      createdAt,
      updatedAt,
      publishedAt,
      tags,
      postCategories,
      postAuthors,
      ...oldPostData
    } = latestPost;

    // Gestione differenziata per le mappature (Risoluzione Punto 2)

    const tagsToConnect = inputTags
      ? inputTags.map((t) => ({ id: t.id }))
      : latestPost.tags.map((t) => ({ id: t.id }));

    const categoriesToCreate = inputCategories
      ? inputCategories.map((c) => ({ categoryId: c.id, sort: c.sort })) // Dal form
      : latestPost.postCategories.map((c) => ({
          categoryId: c.categoryId,
          sort: c.sort,
        })); // Dal DB

    const authorsToCreate = inputAuthors
      ? inputAuthors.map((a) => ({ userId: a.id, sort: a.sort })) // Dal form
      : latestPost.postAuthors.map((a) => ({ userId: a.userId, sort: a.sort })); // Dal DB

    const newPost = await db.post.create({
      data: {
        ...oldPostData,
        ...inputData,
        id: undefined,
        rootId: undefined,
        seoId: undefined,
        title: input.title || latestPost.title,
        slug: input.slug || latestPost.slug,
        version: latestPost.version + 1,
        status: ContentStatus.CHANGED,
        isLatest: false,
        bodyData: input.bodyData ||
          latestPost.bodyData || [
            { type: "paragraph", children: [{ text: "" }] },
          ],
        tiptapBodyData: input.tiptapBodyData || latestPost.tiptapBodyData,
        tags: { connect: tagsToConnect },
        postCategories: { create: categoriesToCreate },
        postAuthors: { create: authorsToCreate },
      },
    });

    return newPost;
  }

  // ============================================================================
  // BRANCH B: IL POST NON È PUBBLICATO -> AGGIORNO LA VERSIONE ESISTENTE
  // ============================================================================
  const updatedPost = await db.post.update({
    where: { id: latestPost.id },
    data: {
      ...inputData,
      // Aggiornamento relazione implicita (Prisma gestisce l'aggiunta/rimozione in automatico con 'set')
      ...(inputTags && {
        tags: { set: inputTags.map((t) => ({ id: t.id })) },
      }),

      // Aggiornamento relazioni esplicite (Svuoto la join table e ricreo i record col nuovo sort/dati)
      ...(inputCategories && {
        postCategories: {
          deleteMany: {}, // Elimina solo i record nella join table legati a QUESTO post
          create: inputCategories.map((c) => ({
            categoryId: c.id,
            sort: c.sort,
          })),
        },
      }),

      ...(inputAuthors && {
        postAuthors: {
          deleteMany: {},
          create: inputAuthors.map((a) => ({ userId: a.id, sort: a.sort })),
        },
      }),
    },
  });

  return updatedPost;
};
