import z from "zod";
import { db } from "@/shared/lib/db";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

import {
  siteRegionCreateSchema,
  siteRegionKeySchema,
  siteRegionPublishSchema,
  siteRegionUnpublishSchema,
  siteRegionUpdateSchema,
} from "../schemas";

import { createSiteRegion } from "./create-site-region";
import { toSiteRegionTrpcError } from "./errors";
import { presentSiteRegionVersion } from "./present-site-region-version";
import { getLiveRegionByKey } from "./queries/get-live-region-by-key";
import {
  publishSiteRegionVersion,
  unpublishSiteRegion,
} from "./publish-site-region";
import { saveSiteRegionVersion } from "./save-site-region";

export const siteRegionsRouter = createTRPCRouter({
  /**
   * Published version of a region, as consumed by the admin/API callers.
   *
   * SmartLink props stay raw here: only the public layout resolves them, so an
   * editor bootstrapped from this query cannot save resolved URLs back.
   */
  getByKey: protectedProcedure
    .input(z.object({ key: siteRegionKeySchema }))
    .query(async ({ input }) =>
      getLiveRegionByKey(input.key, { resolveLinks: false }),
    ),

  /**
   * Editable (current) version of a region. Returns `null` when the region has
   * not been created yet, so the admin screen can offer to create it.
   */
  getCurrent: protectedProcedure
    .input(z.object({ key: siteRegionKeySchema }))
    .query(async ({ input }) => {
      const root = await db.siteRegion.findUnique({
        where: { key: input.key },
        include: { currentVersion: true },
      });

      if (!root || !root.currentVersion) return null;

      return presentSiteRegionVersion(root, root.currentVersion);
    }),

  getVersions: protectedProcedure
    .input(z.object({ key: siteRegionKeySchema }))
    .query(async ({ input }) => {
      const root = await db.siteRegion.findUnique({
        where: { key: input.key },
        select: { id: true },
      });

      if (!root) return [];

      return db.siteRegionVersion.findMany({
        where: { rootId: root.id },
        orderBy: { version: "desc" },
        select: {
          id: true,
          version: true,
          status: true,
          publishedAt: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }),

  create: protectedProcedure
    .input(siteRegionCreateSchema)
    .mutation(async ({ input, ctx }) => {
      return createSiteRegion({ key: input.key, userId: ctx.auth.id });
    }),

  update: protectedProcedure
    .input(siteRegionUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        return await saveSiteRegionVersion(input);
      } catch (error) {
        throw toSiteRegionTrpcError(error, {
          notFoundMessage: "Il layout richiesto non esiste.",
        });
      }
    }),

  publish: protectedProcedure
    .input(siteRegionPublishSchema)
    .mutation(async ({ input }) => {
      try {
        return await publishSiteRegionVersion(input);
      } catch (error) {
        throw toSiteRegionTrpcError(error, {
          internalMessage: "Errore durante la pubblicazione del layout.",
        });
      }
    }),

  unpublish: protectedProcedure
    .input(siteRegionUnpublishSchema)
    .mutation(async ({ input }) => {
      try {
        return await unpublishSiteRegion(input);
      } catch (error) {
        throw toSiteRegionTrpcError(error, {
          notFoundMessage: "Il layout richiesto non esiste.",
          internalMessage: "Errore durante la disattivazione del layout.",
        });
      }
    }),
});
