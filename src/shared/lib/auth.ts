import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/shared/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, _context) => {
          await db.user.update({
            where: { id: user.id },
            data: { roleDefinition: { connect: { key: "USER" } } },
          });
        },
      },
    },
    session: {
      create: {
        before: async (session, _context) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { accountStatus: true },
          });

          return user?.accountStatus === "ACTIVE";
        },
      },
    },
  },
  plugins: [
    customSession(async ({ user }) => {
      const dbUser = await db.user.findUniqueOrThrow({
        where: {
          id: user.id,
        },
      });
      return {
        ...user,
        role: dbUser.role,
        imageUrl: dbUser.imageUrl!,
      };
    }),
  ],
  advanced: {
    skipTrailingSlashes: true,
  },
});
