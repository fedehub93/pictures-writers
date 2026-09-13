import { Prisma } from "@/generated/prisma";

export const legacyUserSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  image: true,
  imageUrl: true,
  bio: true,
  role: true,
  accountStatus: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;
