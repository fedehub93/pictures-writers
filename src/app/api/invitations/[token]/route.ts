import "server-only";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/shared/lib/db";
import { hashInvitationToken, isInvitationUsable } from "@/modules/users/lib/invitation-token";

type Params = { params: Promise<{ token: string }> };

const findInvitation = async (token: string) =>
  db.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: { role: { select: { name: true } } },
  });

export async function GET(_request: Request, { params }: Params) {
  const invitation = await findInvitation((await params).token);
  if (!invitation || !isInvitationUsable(invitation)) {
    return NextResponse.json({ error: "This invitation is no longer valid" }, { status: 410 });
  }
  return NextResponse.json({ email: invitation.email, roleName: invitation.role.name, expiresAt: invitation.expiresAt });
}

export async function POST(request: Request, { params }: Params) {
  const token = (await params).token;
  const body = (await request.json()) as { password?: string; firstName?: string; lastName?: string; bio?: string };
  if (!body.password || body.password.length < 8) {
    return NextResponse.json({ error: "Password must contain at least 8 characters" }, { status: 400 });
  }

  const invitation = await findInvitation(token);
  if (!invitation || !isInvitationUsable(invitation)) {
    return NextResponse.json({ error: "This invitation is no longer valid" }, { status: 410 });
  }

  const claimed = await db.invitation.updateMany({
    where: { id: invitation.id, status: "PENDING", tokenHash: hashInvitationToken(token), expiresAt: { gt: new Date() } },
    data: { status: "ACCEPTED", acceptedAt: new Date(), tokenHash: `accepted-${crypto.randomUUID()}` },
  });
  if (claimed.count !== 1) return NextResponse.json({ error: "This invitation is no longer valid" }, { status: 410 });

  let accountCreated = false;
  let userId: string | undefined;
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: invitation.email,
        password: body.password,
        name: [body.firstName, body.lastName].filter(Boolean).join(" ") || invitation.email,
      },
    });
    if (!result?.user) throw new Error("Unable to create the account");
    accountCreated = true;
    userId = result.user.id;
    await db.user.update({
      where: { id: result.user.id },
      data: {
        firstName: body.firstName?.trim() || null,
        lastName: body.lastName?.trim() || null,
        bio: body.bio?.trim() || null,
        emailVerified: true,
        roleId: invitation.roleId,
        accountStatus: "ACTIVE",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (accountCreated && userId) await db.user.delete({ where: { id: userId } });
    await db.invitation.update({ where: { id: invitation.id }, data: { status: "PENDING", acceptedAt: null, tokenHash: hashInvitationToken(token) } });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create the account" }, { status: 400 });
  }
}
