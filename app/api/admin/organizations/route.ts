import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { createProductSeo } from "@/lib/seo";

const ORGANIZATION_BATCH = 4;

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { name } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organization = await db.organization.create({
      data: {
        name,
      },
    });

    if (!organization) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.log("[ORGANIZATIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const organizations = await db.organization.findMany({});

    return NextResponse.json(organizations);
  } catch (error) {
    console.log("[ORGANIZATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
