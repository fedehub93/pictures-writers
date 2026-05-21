// app/api/backup/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const tables = [
  "settings",
  "user",
  "media",
  "seo",
  "post",
  "category",
  "tag",
  "emailSetting",
  "emailTemplate",
  "emailAudience",
  "emailContact",
  "emailContactInteraction",
  "emailSingleSend",
  "emailSingleSendLog",
  "emailSendLog",
  "emailSubscriptionToken",
  "contactForm",
  "format",
  "genre",
  "impression",
  "notification",
];

export async function GET() {
  try {
    let data: Record<string, any[]> = {};
    for (const table of tables) {
      //@ts-ignore
      data[table] = await db[table as any].findMany();
    }

    const json = JSON.stringify(data);
    return new NextResponse(JSON.stringify(data), {
      headers: {
        "Content-Disposition": "attachment; filename=backup.json",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Errore nel backup:", error);
    return new NextResponse("Errore nel backup del database", { status: 500 });
  }
}
