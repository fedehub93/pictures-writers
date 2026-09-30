import { NextResponse } from "next/server";

import { unsubscribeContactById } from "@/modules/mails/lib/core";

/** Public confirmation page that renders the revoked-consent result. */
const CONFIRMATION_PATH = "/rimuovi-sottoscrizione/";

function readId(request: Request): string | undefined {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  return id ? id : undefined;
}

/**
 * RFC 8058 one-click unsubscribe. Mail clients POST here (body
 * `List-Unsubscribe=One-Click`) when the user taps the native unsubscribe
 * button. The provider sync inside `unsubscribeContactById` is best-effort, so
 * a provider failure still yields a 2xx and the client never surfaces an error.
 */
export async function POST(request: Request) {
  const id = readId(request);

  if (!id) {
    return new NextResponse("Missing id", { status: 400 });
  }

  await unsubscribeContactById(id);

  return new NextResponse(null, { status: 204 });
}

/**
 * Browser / footer link. Redirects to the existing public confirmation page,
 * which performs the revocation, keeping a single user-facing flow.
 */
export async function GET(request: Request) {
  const id = readId(request);
  const destination = id
    ? `${CONFIRMATION_PATH}?id=${encodeURIComponent(id)}`
    : CONFIRMATION_PATH;

  return NextResponse.redirect(new URL(destination, request.url), 303);
}
