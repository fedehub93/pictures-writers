import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { MediaType } from "@prisma/client";

import { db } from "@/lib/db";
import { getContactByEmail } from "@/data/email-contact";

const utapi = new UTApi();

export async function POST(req: Request) {
  try {
    // const values = await req.json();
    const formData = await req.formData();
    const title = formData.get("title");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const pageCount = formData.get("pageCount");
    const formatId = formData.get("formatId");
    const genreId = formData.get("genreId");
    const file = formData.get("file") as File;

    // Controllo che i valori non siano null
    if (typeof title !== "string") {
      return NextResponse.json(
        { error: "Title non è valido" },
        { status: 400 }
      );
    }

    if (typeof firstName !== "string") {
      return NextResponse.json(
        { error: "First Name non è valido" },
        { status: 400 }
      );
    }

    if (typeof lastName !== "string") {
      return NextResponse.json(
        { error: "First Name non è valido" },
        { status: 400 }
      );
    }

    if (typeof email !== "string") {
      return NextResponse.json(
        { error: "Email non è valido" },
        { status: 400 }
      );
    }

    const pageCountNumber = pageCount
      ? parseInt(pageCount.toString(), 10)
      : null;

    if (pageCountNumber === null || isNaN(pageCountNumber)) {
      return NextResponse.json(
        { error: "Page Count non è un numero valido" },
        { status: 400 }
      );
    }

    if (typeof formatId !== "string") {
      return NextResponse.json(
        { error: "Email non è valido" },
        { status: 400 }
      );
    }

    if (typeof genreId !== "string") {
      return NextResponse.json(
        { error: "Email non è valido" },
        { status: 400 }
      );
    }

    if (!file) {
      return new NextResponse("BAD REQUEST", { status: 400 });
    }

    const utRes = await utapi.uploadFiles(file);

    if (!utRes.data?.key || !utRes.data.url || !utRes.data.name) {
      return new NextResponse("BAD REQUEST", { status: 400 });
    }

    const asset = await db.media.create({
      data: {
        key: utRes.data?.key,
        url: utRes.data?.url,
        name: utRes.data?.name,
        size: utRes.data?.size,
        type: MediaType.FILE,
      },
    });

    if (!asset) {
      return new NextResponse("BAD REQUEST", { status: 400 });
    }

    const newImpression = await db.impression.create({
      data: {
        title: title,
        email: email,
      },
    });

    if (!newImpression) {
      return new NextResponse("BAD REQUEST", { status: 400 });
    }

    const impression = db.impression.update({
      where: { id: newImpression.id },
      data: {
        firstName,
        lastName,
        pageCount: pageCountNumber,
        formatId,
        genreId,
        fileId: asset.id,
      },
    });

    const existingContact = await getContactByEmail(email);

    if (!existingContact) {
      await db.emailContact.create({
        data: {
          email,
          isSubscriber: true,
          emailVerified: new Date(),
        },
      });
    }

    if (!impression) {
      return new NextResponse("BAD REQUEST", { status: 400 });
    }

    return NextResponse.json(impression);
  } catch (error) {
    console.log("[COVERAGE_IMPRESSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
