import type { Prisma } from "@/generated/prisma";

export const USER_LIST_SORTS = [
  "name",
  "email",
  "createdAt",
  "accountStatus",
] as const;

export type UserListSort = (typeof USER_LIST_SORTS)[number];
export type UserListDirection = "asc" | "desc";

export const getUserOrderBy = (
  sort: UserListSort,
  direction: UserListDirection,
): Prisma.UserOrderByWithRelationInput[] => [
  { [sort]: direction },
  { id: "asc" },
];
