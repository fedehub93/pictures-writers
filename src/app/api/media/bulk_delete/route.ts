import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

const utapi = new UTApi();

export async function DELETE(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    for (const id of values) {
      const deletedAsset = await db.media.delete({
        where: {
          id,
        },
        select: {
          id: true,
          key: true,
        },
      });

      if (deletedAsset && deletedAsset.key) {
        await utapi.deleteFiles(deletedAsset.key);
      }
    }

    return NextResponse.json({
      status: "OK",
      message: "ASSETS DELETED SUCCESSFULLY",
    });
  } catch (error) {
    console.log("[MEDIA_BULK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
