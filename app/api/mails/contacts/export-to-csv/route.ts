import { NextResponse } from "next/server";
import { Parser } from "json2csv";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, res: NextResponse) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Recupera i dati da Prisma
    const contacts = await db.emailContact.findMany({
      where: {
        isSubscriber: true,
      },
      select: {
        email: true, // Seleziona solo i dati necessari
      },
    });

    // Prepara i dati per JSON2CSV
    const fields = ["Email Address"];
    const data = contacts.map((user) => ({ "Email Address": user.email }));

    // Crea un parser CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    // Crea una risposta in formato CSV
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="export.csv"',
      },
    });
  } catch (error) {
    console.log("[EMAIL_CONTACTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
