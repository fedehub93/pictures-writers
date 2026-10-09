import Stripe from "stripe";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { convertToSubcurrency } from "@/lib/format";

export async function POST(req: Request) {
  const { productId } = await req.json();

  try {
    const root = await db.productRoot.findFirst({
      where: {
        OR: [{ id: productId }, { versions: { some: { id: productId } } }],
      },
      select: {
        id: true,
        liveVersion: {
          select: {
            id: true,
            title: true,
            price: true,
            imageCover: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    const product = root?.liveVersion;

    if (!root || !product) {
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
            images: product.imageCover ? [product.imageCover.url] : [],
          },
          unit_amount: convertToSubcurrency(product.price || 0),
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
        productId: root.id,
        productRootId: root.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.log("[CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
