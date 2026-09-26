import "server-only";

import { TRPCError } from "@trpc/server";
import z from "zod";

import { db } from "@/shared/lib/db";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";

import {
  decryptCredentialSecret,
  encryptCredentialSecret,
} from "../lib/credential-store";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../../constants";

const credentialSelect = {
  id: true,
  name: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const credentialsRouter = createTRPCRouter({
  getMany: permissionProcedure(PERMISSIONS.AUTOMATIONS_READ)
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      }),
    )
    .query(async ({ input }) => {
      const where = input.search
        ? {
            OR: [
              {
                name: { contains: input.search, mode: "insensitive" as const },
              },
              {
                type: { contains: input.search, mode: "insensitive" as const },
              },
            ],
          }
        : undefined;

      const [items, total] = await Promise.all([
        db.credential.findMany({
          where,
          select: credentialSelect,
          orderBy: { createdAt: "desc" },
          take: input.pageSize,
          skip: (input.page - 1) * input.pageSize,
        }),
        db.credential.count({ where }),
      ]);

      return {
        items,
        total,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),
  getOne: permissionProcedure(PERMISSIONS.AUTOMATIONS_READ)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const credential = await db.credential.findUnique({
        where: { id: input.id },
        select: credentialSelect,
      });

      if (!credential) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
      }

      return credential;
    }),
  create: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(
      z.object({
        name: z.string().min(1, { error: "Name is required" }),
        type: z.string().min(1, { error: "Type is required" }),
        secret: z.string().min(1, { error: "Secret is required" }),
      }),
    )
    .mutation(async ({ input }) => {
      return db.credential.create({
        data: {
          name: input.name,
          type: input.type,
          secretEncrypted: encryptCredentialSecret(input.secret),
        },
        select: credentialSelect,
      });
    }),
  update: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        type: z.string().min(1).optional(),
        secret: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await db.credential.findUnique({ where: { id: input.id } });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
      }
      return db.credential.update({
        where: { id: input.id },
        data: {
          name: input.name,
          type: input.type,
          secretEncrypted: input.secret
            ? encryptCredentialSecret(input.secret)
            : undefined,
        },
        select: credentialSelect,
      });
    }),
  remove: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await db.credential.findUnique({ where: { id: input.id } });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
      }

      return db.credential.delete({
        where: { id: input.id },
        select: credentialSelect,
      });
    }),
  decrypt: permissionProcedure(PERMISSIONS.AUTOMATIONS_WRITE)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const credential = await db.credential.findUnique({
        where: { id: input.id },
      });

      if (!credential) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
      }

      return {
        id: credential.id,
        name: credential.name,
        type: credential.type,
        secret: decryptCredentialSecret(credential.secretEncrypted),
      };
    }),
});
