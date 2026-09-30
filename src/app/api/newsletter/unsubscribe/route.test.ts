import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/lib/db";

import { GET, POST } from "./route";

const makeRequest = (method: "GET" | "POST", query = "") =>
  new Request(`http://localhost/api/newsletter/unsubscribe/${query}`, {
    method,
    body: method === "POST" ? "List-Unsubscribe=One-Click" : undefined,
  });

async function createContact(email: string, isSubscriber = true) {
  return db.emailContact.create({ data: { email, isSubscriber } });
}

describe("/api/newsletter/unsubscribe", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await db.emailContact.deleteMany({});
    await db.emailSetting.deleteMany({});
    // No provider is configured, so the best-effort provider sync inside
    // `unsubscribeContactById` fails; swallow its log noise.
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleErrorSpy.mockRestore();
    await db.emailContact.deleteMany({});
  });

  it("POST returns 400 when the id is missing", async () => {
    const response = await POST(makeRequest("POST"));

    expect(response.status).toBe(400);
  });

  it("POST revokes consent and returns 2xx even when the provider sync fails", async () => {
    const contact = await createContact("one-click@test.com");

    const response = await POST(makeRequest("POST", `?id=${contact.id}`));

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);

    const updated = await db.emailContact.findUnique({
      where: { id: contact.id },
    });
    expect(updated).not.toBeNull();
    expect(updated?.isSubscriber).toBe(false);
  });

  it("POST still returns 2xx for an unknown id", async () => {
    const response = await POST(makeRequest("POST", "?id=missing"));

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  });

  it("GET redirects to the public confirmation page", async () => {
    const response = await GET(makeRequest("GET", "?id=contact-1"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(response.headers.get("location")).toContain(
      "/rimuovi-sottoscrizione/?id=contact-1",
    );
  });
});
