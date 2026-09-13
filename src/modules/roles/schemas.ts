import z from "zod";

const permissionIds = z.array(z.string().uuid()).default([]);

export const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(80),
  permissionIds,
});

export const updateRoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  permissionIds,
  isActive: z.boolean(),
});

export const deleteRoleSchema = z.object({ id: z.string().uuid() });
