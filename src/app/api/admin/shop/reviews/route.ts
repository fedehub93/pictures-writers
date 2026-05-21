import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { reviewsInsertSchema } from "@/app/(admin)/admin/(routes)/shop/reviews/schema";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();

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

    const review = await db.reviews.create({
      data: { ...values },
    });

    if (!review) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.log("[REVIEW_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
