import "server-only";

import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts: Date.now() });
  } catch (error) {
    console.error("[HEALTH]", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
