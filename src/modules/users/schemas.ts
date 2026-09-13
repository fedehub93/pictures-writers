import { z } from "zod";

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./constants";

export const userListSchema = z.object({
  search: z.string().trim().max(100).default(""),
  roleId: z.string().uuid().optional(),
  accountStatus: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  page: z.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sort: z.enum(["name", "email", "createdAt", "accountStatus"]).default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export const updateUserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().trim().max(100).nullable().optional(),
  lastName: z.string().trim().max(100).nullable().optional(),
  bio: z.string().trim().max(2000).nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  roleId: z.string().uuid(),
});

export const updateStatusSchema = z.object({
  id: z.string().uuid(),
  accountStatus: z.enum(["ACTIVE", "SUSPENDED"]),
});

export const createInvitationSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  roleId: z.string().uuid(),
});

export const invitationIdSchema = z.object({ id: z.string().uuid() });

export const resendInvitationSchema = invitationIdSchema;

export const requestPasswordResetSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
});

export const activityHistorySchema = z.object({ userId: z.string().uuid() });
