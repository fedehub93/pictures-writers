// pages/api/process-image.ts
import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { mapImageToMetadata, processImage } from "@/lib/image";
import { MediaType } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // const user = await authAdmin();

    // if (!user) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }

    // const images = await db.media.findMany({
    //   where: {
    //     key: "6W9h1W8RJD71wT0P1DDpkmBERnry65JZxQV2Luta4pdcfI1l",
    //     type: MediaType.IMAGE,
    //   },
    //   take: 3,
    // });

    // for (const image of images) {
    //   if (!image.metadata) {
    //     const processedImage = await processImage(image.url, image.name);

    //     const imagesToUpdate = mapImageToMetadata(
    //       image.key!,
    //       image.url!,
    //       processedImage
    //     );

    //     const updatedImage = await db.media.update({
    //       where: {
    //         id: image.id,
    //       },
    //       data: {
    //         metadata: { ...imagesToUpdate },
    //       },
    //     });
    //   }
    // }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.log("[PROCESS_IMAGE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
