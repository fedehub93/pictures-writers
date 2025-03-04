import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { ContentStatus } from "@prisma/client";

export async function POST(req: Request) {
  const { productId } = await req.json();

  try {
    // const user = await currentUser();
    // if (!user || !user.id || !user.emailAddresses?.[0]?.emailAddress) {
    //   return new NextResponse("Unauthorized", { status: 401 });
    // }
    const product = await db.product.findUnique({
      where: {
        id: productId,
        status: ContentStatus.PUBLISHED,
      },
      select: {
        id: true,
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

    // const purchase = await db.purchase.findUnique({
    //   where: {
    //     userId_courseId: {
    //       userId: user.id,
    //       courseId: params.courseId,
    //     },
    //   },
    // });

    // if (purchase) {
    //   return new NextResponse("Already purchased", { status: 400 });
    // }

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

    // let stripeCustomer = await db.stripeCustomer.findUnique({
    //   where: {
    //     userId: user.id,
    //   },
    //   select: {
    //     stripeCustomerId: true,
    //   },
    // });

    let stripeCustomer = null;

    if (!stripeCustomer) {
      // stripeCustomer = await stripe.customers.create({
      //   email: user.emailAddresses[0].emailAddress,
      // });
      // stripeCustomer = await db.stripeCustomer.create({
      //   data: {
      //     userId: user.id,
      //     stripeCustomerId: customer.id,
      //   },
      // });
    }

    const session = await stripe.checkout.sessions.create({
      // customer: stripeCustomer.id,
      line_items,
      mode: "payment",
      ui_mode: "embedded",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/shop/checkout?success=1`,
      payment_method_types: ["card"],
      automatic_tax: { enabled: true },
      metadata: {
        productId: product.id,
        // userId: user.id,
      },
    });

    return NextResponse.json({
      id: session.id,
      client_secret: session.client_secret,
    });
  } catch (error) {
    console.log("[CHECKOUT_EMBEDDED]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
