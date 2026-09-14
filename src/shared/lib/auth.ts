import "server-only";

import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/shared/lib/db";
import { sendPasswordResetEmail } from "@/modules/users/server/emails";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, _context) => {
          const invitation = await db.invitation.findFirst({
            where: {
              email: user.email,
              status: "PENDING",
              expiresAt: { gt: new Date() },
            },
            select: { id: true },
          });
          return invitation ? false : undefined;
        },
        after: async (_user, _context) => {},
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
