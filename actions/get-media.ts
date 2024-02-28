import { Media } from "@prisma/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

type GetMedia = {};

export const getCourses = async ({}: GetMedia): Promise<Media[]> => {
  try {
    const user = await authAdmin();
    if(!user) {
      return []
    }
    const media = await db.media.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return media;
  } catch (error) {
    console.log("GET_MEDIA", error);
    return [];
  }
};
