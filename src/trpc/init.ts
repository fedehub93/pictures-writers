import { cache } from "react";
import { headers } from "next/headers";
import superjson from "superjson";

import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/shared/lib/auth";
import { getAuthorizedUser } from "@/shared/lib/authorization";
import { PERMISSIONS, getProcedurePermissions } from "@/shared/lib/permissions";
export const createTRPCContext = cache(async () => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return { userId: "user_123" };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
const authenticatedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !(await getAuthorizedUser(session.id))) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  return next({ ctx: { ...ctx, auth: session } });
});

export const protectedProcedure = authenticatedProcedure.use(
  async ({ ctx, next, path }) => {
    const permissions = getProcedurePermissions(path);
    const authorized = await Promise.all(
      permissions.map((permission) => getAuthorizedUser(ctx.auth.id, permission)),
    );
    if (!authorized.some(Boolean)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
    }

    return next({ ctx });
  },
);

export const permissionProcedure = (permission: string) =>
  authenticatedProcedure.use(async ({ ctx, next }) => {
    if (!(await getAuthorizedUser(ctx.auth.id, permission))) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });
    }

    return next({ ctx });
  });
