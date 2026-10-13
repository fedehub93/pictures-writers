import type { Prisma } from "@/generated/prisma";

/**
 * The user fields a Dashboard list widget shows for an author, and the mapper
 * that turns them into the compact author a widget renders. Shared so every
 * content widget presents an author the same way.
 */
export const DASHBOARD_AUTHOR_SELECT = {
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  imageUrl: true,
} satisfies Prisma.UserSelect;

export type DashboardAuthorUser = Prisma.UserGetPayload<{
  select: typeof DASHBOARD_AUTHOR_SELECT;
}>;

/** The author a Dashboard list widget shows: a name and an optional avatar. */
export interface DashboardAuthor {
  name: string;
  imageUrl: string | null;
}

/**
 * Project a user row onto the compact author a widget shows, preferring the
 * display name, then the combined first and last name, then the email.
 */
export const toDashboardAuthor = (
  user: DashboardAuthorUser | null | undefined,
): DashboardAuthor | null => {
  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const name = user.name || fullName || user.email || "";

  return { name, imageUrl: user.imageUrl };
};
