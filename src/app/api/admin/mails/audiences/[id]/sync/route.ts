import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { syncContactsWithProvider } from "@/modules/mails/lib/core";

export const maxDuration = 60;

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const user = await authAdmin();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { id: audienceId } = params;

    const { skip, take } = await req.json();

    const result = await syncContactsWithProvider({
      skip: Number(skip),
      take: Number(take),
      audienceId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          message: `Errors: ${result.errors[0].email}: ${result.errors[0].reason}`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      message: "Sync successfully",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
