import z from "zod";

import { TRPCError } from "@trpc/server";
import type { Prisma } from "@/generated/prisma";

import { ContentStatus, ProductType } from "@/generated/prisma";

import {
  buildListOrderBy,
  sortByDefaultOrder,
} from "@/shared/lib/list-sorting";
import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { revalidateContent } from "@/shared/lib/revalidate-content";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  PRODUCT_LIST_SORTS,
} from "../constants";

import {
  productInsertSchema,
  productUpdateSchema,
  productUpdateSeoSchema,
} from "../schemas";

import { createProduct } from "./create-product";
import { deleteProductRoot } from "./delete-product";
import { toProductTrpcError } from "./errors";
import { publishProductVersion, unpublishProductVersion } from "./publish-product";
import { saveProductVersion } from "./save-product";
import { updateProductVersionSeo } from "./update-seo";
import { getPublishedProductByRootId } from "./queries/get-published-product-by-root-id";

export const productsRouter = createTRPCRouter({
  create: permissionProcedure(PERMISSIONS.PRODUCTS_CREATE)
    .input(productInsertSchema)
    .mutation(async ({ input, ctx }) => {
      return createProduct({ ...input, userId: ctx.auth.id });
    }),

  update: permissionProcedure(PERMISSIONS.PRODUCTS_UPDATE)
    .input(productUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        return await saveProductVersion(input);
      } catch (error) {
        throw toProductTrpcError(error);
      }
    }),

  updateSeo: permissionProcedure(PERMISSIONS.PRODUCTS_UPDATE)
    .input(productUpdateSeoSchema)
    .mutation(async ({ input }) => {
      try {
        return await updateProductVersionSeo(input);
      } catch (error) {
        throw toProductTrpcError(error);
      }
    }),

  remove: permissionProcedure(PERMISSIONS.PRODUCTS_DELETE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const deleted = await deleteProductRoot({ id: input.id });

        revalidateContent("product");

        return deleted;
      } catch (error) {
        throw toProductTrpcError(error, {
          internalMessage: "Errore durante l'eliminazione del prodotto.",
        });
      }
    }),

  getOne: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const root = await db.productRoot.findUnique({
        where: { id: input.id },
        include: {
          currentVersion: {
            include: {
              seo: true,
              imageCover: true,
              category: true,
              gallery: {
                include: { media: true },
                orderBy: { sort: "asc" },
              },
              faqs: { orderBy: { sort: "asc" } },
            },
          },
        },
      });

      if (!root || !root.currentVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      return {
        ...root.currentVersion,
        rootId: root.id,
        slug: root.slug,
        type: root.type,
      };
    }),

  getLastByRootId: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(z.object({ rootId: z.string().min(1) }))
    .query(async ({ input }) => {
      const root = await db.productRoot.findUnique({
        where: { id: input.rootId },
        include: {
          currentVersion: {
            include: {
              seo: true,
              imageCover: true,
              category: true,
              gallery: {
                include: { media: true },
                orderBy: { sort: "asc" },
              },
              faqs: { orderBy: { sort: "asc" } },
            },
          },
        },
      });

      if (!root || !root.currentVersion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }

      return {
        ...root.currentVersion,
        rootId: root.id,
        slug: root.slug,
        type: root.type,
      };
    }),

  getPublishedByRootId: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(z.object({ rootId: z.string().min(1) }))
    .query(async ({ input }) => {
      return getPublishedProductByRootId(input.rootId);
    }),

  getMany: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        status: z
          .enum([
            ContentStatus.DRAFT,
            ContentStatus.CHANGED,
            ContentStatus.PUBLISHED,
          ])
          .nullish(),
        type: z.enum(ProductType).nullish(),
        category: z.string().nullish(),
        // When set, list roots that have a live version and project the live
        // version instead of the current one. Used by the product pickers
        // (embedded product, widget, ads item) so an edited-but-live product
        // stays selectable while the draft reads stay current-version scoped.
        publishedOnly: z.boolean().nullish(),
        sort: z.enum(PRODUCT_LIST_SORTS).nullish(),
        direction: z.enum(["asc", "desc"]).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const search = input.search?.trim();
      const publishedOnly = input.publishedOnly === true;

      const versionWhere = {
        title: search
          ? { contains: search, mode: "insensitive" as const }
          : undefined,
        status:
          !publishedOnly && input.status ? { in: [input.status] } : undefined,
        categoryId: input.category ? input.category : undefined,
      };

      const versionRelation = publishedOnly ? "liveVersion" : "currentVersion";

      const where: Prisma.ProductRootWhereInput = {
        ...(publishedOnly
          ? { liveVersion: { is: versionWhere } }
          : { currentVersion: { is: versionWhere } }),
        type: input.type ? { in: [input.type] } : undefined,
      };

      const versionInclude = {
        include: { imageCover: true, category: true },
      } as const;

      const include = {
        currentVersion: versionInclude,
        liveVersion: versionInclude,
      } satisfies Prisma.ProductRootInclude;

      type RootWithVersions = Prisma.ProductRootGetPayload<{
        include: typeof include;
      }>;

      const versionOf = (root: RootWithVersions) =>
        publishedOnly ? root.liveVersion : root.currentVersion;

      const mapItem = (root: RootWithVersions) => {
        const version = versionOf(root);
        if (!version) return null;

        return {
          id: version.id,
          rootId: root.id,
          title: version.title,
          slug: root.slug,
          type: root.type,
          status: version.status,
          price: version.price,
          discountedPrice: version.discountedPrice,
          metadata: version.metadata,
          publishedAt: version.publishedAt,
          firstPublishedAt: root.firstPublishedAt,
          createdAt: version.createdAt,
          updatedAt: version.updatedAt,
          imageCover: version.imageCover,
          category: version.category,
        };
      };

      const orderBy =
        buildListOrderBy<Prisma.ProductRootOrderByWithRelationInput>({
          sort: input.sort,
          direction: input.direction,
          sortable: PRODUCT_LIST_SORTS,
          relation: input.sort === "type" ? undefined : versionRelation,
        });

      if (orderBy) {
        const [roots, total] = await Promise.all([
          db.productRoot.findMany({
            where,
            include,
            orderBy,
            take: input.pageSize,
            skip: (input.page - 1) * input.pageSize,
          }),
          db.productRoot.count({ where }),
        ]);

        const items = roots
          .map(mapItem)
          .filter((item): item is NonNullable<typeof item> => item !== null);

        return {
          items,
          total,
          totalPages: Math.ceil(total / input.pageSize),
        };
      }

      const roots = await db.productRoot.findMany({ where, include });

      const rows = roots
        .map((root) => {
          const version = versionOf(root);
          if (!version) return null;

          return {
            id: root.id,
            title: version.title,
            status: version.status,
            publishedAt: version.publishedAt,
            root,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);

      const total = rows.length;
      const totalPages = Math.ceil(total / input.pageSize);

      const items = sortByDefaultOrder(rows)
        .slice((input.page - 1) * input.pageSize, input.page * input.pageSize)
        .map(({ root }) => mapItem(root))
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return { items, total, totalPages };
    }),

  getByRootIds: permissionProcedure(PERMISSIONS.PRODUCTS_READ)
    .input(z.object({ ids: z.array(z.uuid()).nonempty() }))
    .query(async ({ input }) => {
      const roots = await db.productRoot.findMany({
        where: {
          id: { in: input.ids },
          liveVersion: { isNot: null },
        },
        include: {
          liveVersion: {
            select: {
              id: true,
              title: true,
              imageCover: { select: { url: true } },
            },
          },
        },
      });

      return roots.map((root) => ({
        id: root.liveVersion!.id,
        rootId: root.id,
        title: root.liveVersion!.title,
        imageCover: root.liveVersion!.imageCover,
      }));
    }),

  publish: permissionProcedure(PERMISSIONS.PRODUCTS_PUBLISH)
    .input(z.object({ id: z.string().min(1), rootId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const published = await publishProductVersion(input);

        revalidateContent("product");

        return published;
      } catch (error) {
        throw toProductTrpcError(error, {
          internalMessage: "Failed to publish the product",
        });
      }
    }),

  unpublish: permissionProcedure(PERMISSIONS.PRODUCTS_PUBLISH)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const unpublished = await unpublishProductVersion(input);

        revalidateContent("product");

        return unpublished;
      } catch (error) {
        throw toProductTrpcError(error, {
          internalMessage: "Failed to unpublish the product",
        });
      }
    }),
});
