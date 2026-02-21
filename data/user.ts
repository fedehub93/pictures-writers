import { db } from "@/lib/db";
import { User } from "@/generated/prisma";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findFirst({
      where: { email },
    });

    return user;
  } catch (error) {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
    });

    return user;
  } catch (error) {
    return null;
  }
};

export const getAuthorsString = (
  authors: {
    firstName: string | null;
    lastName: string | null;
  }[]
) => {
  return authors.map((a) => `${a.firstName} ${a.lastName}`).join(", ");
};
