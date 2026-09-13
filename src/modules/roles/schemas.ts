import z from "zod";

const permissionIds = z.array(z.string().trim().min(1)).default([]);

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
