import { NextResponse } from "next/server";

import { getEmailContactGrowth } from "@/data/email-contact";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    // Converti le date in oggetti Date
    const startDate = new Date(from as string);
    const endDate = new Date(to as string);

    const mailContactStats = await getEmailContactGrowth(startDate, endDate);

    if (!mailContactStats) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(mailContactStats);
  } catch (error) {
    console.log("[CONTACT_STATS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
