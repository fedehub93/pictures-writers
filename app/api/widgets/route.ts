import { NextResponse } from "next/server";

import { WidgetSection } from "@prisma/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const { name, section, type } = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!type || !section) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    let metadata: any = null;
    if (section === WidgetSection.HERO) {
      metadata = {
        section: WidgetSection.HERO,
        type,
      };
    }

    if (section === WidgetSection.POPUP) {
      metadata = {
        section: WidgetSection.POPUP,
        type,
      };
    }

    if (section === WidgetSection.SIDEBAR) {
      metadata = {
        section: WidgetSection.SIDEBAR,
        type,
      };
    }

    const maxSort = await db.widget.findFirst({
      where: { section },
      orderBy: { sort: "desc" },
      select: { sort: true },
    });

    const nextSort = maxSort?.sort ? maxSort.sort + 1 : 1;

    const widget = await db.widget.create({
      data: {
        name,
        section,
        type,
        metadata,
        sort: nextSort,
      },
    });

    if (!widget) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(widget);
  } catch (error) {
    console.log("[WIDGETS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
