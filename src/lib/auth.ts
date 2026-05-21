import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    customSession(async ({ user, session }) => {
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
