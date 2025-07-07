import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function PATCH(
  req: NextRequest,
  props: {
    params: Promise<{
      organizationId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { organizationId } = params;

    const values = await req.json();

    const organization = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return new NextResponse("Bad request", { status: 400 });
    }

    let stripeAccountId = organization.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({});
      stripeAccountId = account.id;
    }

    if (!stripeAccountId) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const updatedOrganization = await db.organization.update({
      where: { id: organization.id },
      data: {
        ...values,
        stripeAccountId,
        logoId: undefined,
        logo: values.logoId
          ? {
              connect: { id: values.logoId ?? null },
            }
          : { disconnect: true },
      },
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.log("[ORGANIZATION_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
