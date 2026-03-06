import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import {
  reviewsInsertSchema,
  reviewsUpdateSchema,
} from "@/app/(admin)/admin/(routes)/shop/reviews/schema";

export async function GET(
  req: Request,
  props: {
    params: Promise<{
      reviewId: string;
    }>;
  },
) {
  try {
    const params = await props.params;
    const user = await authAdmin();
    const { reviewId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const review = await db.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.log("[REVIEW_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      reviewId: string;
    }>;
  },
) {
  try {
    const params = await props.params;
    const user = await authAdmin();
    const { reviewId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const review = await db.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedReview = await db.reviews.deleteMany({
      where: { id: reviewId },
    });

    return NextResponse.json(deletedReview);
  } catch (error) {
    console.log("[REVIEW_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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

    // Data parsing and validation
    const body = await req.json();
    const parsed = reviewsInsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    const values = parsed.data;

    const updatedReview = await db.reviews.update({
      where: { id: reviewId },
      data: { ...values },
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.log("[REVIEW_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
