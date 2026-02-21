import { NextResponse } from "next/server";
import { ProductAcquisitionMode } from "@/generated/prisma";

import { db } from "@/lib/db";
import { getPublishedProductByRootId } from "@/data/product";

export async function POST(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
    }>;
  }
) {
  try {
    const { rootId } = await props.params;

    if (!rootId) {
      return NextResponse.json(
        { error: "Missing rootId in URL" },
        { status: 400 }
      );
    }

    // Dati inviati dal client
    const body = await req.json();

    const product = await getPublishedProductByRootId(rootId);

    if (
      !product ||
      product.acquisitionMode !== ProductAcquisitionMode.FORM ||
      !product.formId
    ) {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }

    // Recupera il form per validare che esista
    const form = await db.form.findUnique({
      where: { id: product.formId },
      select: { id: true, fields: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 400 });
    }

    if (typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid submission data format" },
        { status: 400 }
      );
    }

    const emailFromBody = body.email || null;

    // Salva la submission
    const submission = await db.formSubmission.create({
      data: {
        formId: product.formId,
        email: emailFromBody,
        data: body,
      },
    });

    return NextResponse.json({
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("PRODUCTS_ROOT_ID_SUBMISSION:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
