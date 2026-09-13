import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/shared/lib/authorization";
import {
  legacyUserCreateSchema,
} from "@/modules/users/schemas";
import { legacyUserSelect } from "@/modules/users/server/legacy-contract";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await authAdmin(PERMISSIONS.USERS_CREATE);

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = legacyUserCreateSchema.parse(await req.json());

    const createdUser = await db.user.create({
      data: {
        ...values,
        role: "USER",
        roleDefinition: {
          connect: { key: "USER" },
        },
      },
      select: legacyUserSelect,
    });

    return NextResponse.json(createdUser);
  } catch (error) {
    console.log("[USER_POST]", error);
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Invalid request", { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
