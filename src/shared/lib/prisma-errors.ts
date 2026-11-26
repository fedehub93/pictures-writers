import { Prisma } from "@/generated/prisma";

/**
 * True when Prisma rejected a write because it violated a unique constraint
 * (`P2002`). Callers use it to turn a race into an idempotent re-read or an
 * explicit conflict instead of leaking the driver error.
 */
export const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/**
 * True when Prisma rejected a write because a related row does not exist
 * (`P2003`). Callers use it to name the relation that disappeared while the
 * write was being prepared.
 */
export const isForeignKeyConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
