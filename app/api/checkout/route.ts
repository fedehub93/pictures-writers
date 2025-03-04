import Stripe from "stripe";
import { NextResponse } from "next/server";
import { ContentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const { productId } = await req.json();

  try {
    const product = await db.product.findUnique({
      where: {
        id: productId,
        status: ContentStatus.PUBLISHED,
      },
      select: {
        id: true,
        rootId: true,
        title: true,
        slug: true,
        price: true,
        imageCover: {
          select: {
            url: true,
          },
        },
      },
    });

    if (!product) {
      return new NextResponse("Not found", { status: 400 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        quantity: 1,
        price_data: {
          currency: "EUR",
          product_data: {
            name: product.title,
            description: "PRODUCT DESCRIPTION",
            images: [product.imageCover?.url!],
          },
          unit_amount: Math.round(1 * 100),
        },
      },
    ];

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      ui_mode: "hosted",
      payment_method_types: ["card", "paypal"],
      automatic_tax: { enabled: true },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/checkout/error`,
      metadata: {
        productId: product.id,
        productRootId: product.rootId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log("[CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
