import z from "zod";

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "./constants";

const permissionIds = z.array(z.string().trim().min(1)).default([]);

export const roleListSchema = z.object({
  page: z.number().int().min(1).default(DEFAULT_PAGE),
  pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  permissionIds,
});

export const updateRoleSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(80),
  permissionIds,
  isActive: z.boolean(),
});

export const deleteRoleSchema = z.object({ id: z.string().trim().min(1) });