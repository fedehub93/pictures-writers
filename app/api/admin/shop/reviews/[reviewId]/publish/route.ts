import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      reviewId: string;
    }>;
  },
) {
  try {
    const user = await authAdmin();
    const { reviewId } = await props.params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedReview = await db.reviews.update({
      where: { id: reviewId },
      data: { status: true },
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.log("[REVIEW_ID_PUBLISH_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
