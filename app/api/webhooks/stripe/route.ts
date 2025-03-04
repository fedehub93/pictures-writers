import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendWebinarPurchaseEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const productId = session?.metadata?.productId;
  const email = session?.customer_details?.email!;

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { rootId: true },
  });

  if (event.type === "checkout.session.completed") {
    if (!productId || !product) {
      return new NextResponse(`Webhook Error: Missing metadata`, {
        status: 400,
      });
    }

    await db.purchase.create({
      data: {
        email,
        productId,
        productRootId: product.rootId!,
      },
    });

    await sendWebinarPurchaseEmail(email, product.rootId!);
  } else {
    return new NextResponse(
      `Webhook Error: Unhandled event type ${event.type}`,
      { status: 200 }
    );
  }

  return new NextResponse(null, { status: 200 });
}
