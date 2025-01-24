import { NextRequest, NextResponse } from "next/server";
import { WidgetSection, WidgetType } from "@prisma/client";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import {
  setDefaultWidgetAuthorMetadata,
  setDefaultWidgetCategoryMetadata,
  setDefaultWidgetNewsletterMetadata,
  setDefaultWidgetPostMetadata,
  setDefaultWidgetProductMetadata,
  setDefaultWidgetSearchMetadata,
  setDefaultWidgetSocialMetadata,
  setDefaultWidgetTagMetadata,
} from "@/data/widget";

export async function GET(req: NextRequest) {
  try {
    const user = await authAdmin();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const s = searchParams.get("s") || "";
    const section = searchParams.get("section");

    const validSection =
      section && Object.values(WidgetSection).includes(section as WidgetSection)
        ? (section as WidgetSection)
        : undefined;

    const widgets = await db.widget.findMany({
      where: {
        section: validSection,
        isEnabled: true,
      },
      orderBy: { sort: "asc" },
    });

    return NextResponse.json(widgets);
  } catch (error) {
    console.log("[WIDGETS_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    if (section === WidgetSection.POST_SIDEBAR) {
      if (type === WidgetType.SEARCH_BOX) {
        metadata = { ...setDefaultWidgetSearchMetadata() };
      }
      if (type === WidgetType.POST) {
        metadata = { ...setDefaultWidgetPostMetadata() };
      }
      if (type === WidgetType.CATEGORY) {
        metadata = { ...setDefaultWidgetCategoryMetadata() };
      }
      if (type === WidgetType.PRODUCT) {
        metadata = { ...setDefaultWidgetProductMetadata() };
      }
      if (type === WidgetType.SOCIAL) {
        metadata = { ...setDefaultWidgetSocialMetadata() };
      }
    }

    if (section === WidgetSection.POST_BOTTOM) {
      if (type === WidgetType.NEWSLETTER) {
        metadata = { ...setDefaultWidgetNewsletterMetadata() };
      }
      if (type === WidgetType.AUTHOR) {
        metadata = { ...setDefaultWidgetAuthorMetadata() };
      }
      if (type === WidgetType.TAG) {
        metadata = { ...setDefaultWidgetTagMetadata() };
      }
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
