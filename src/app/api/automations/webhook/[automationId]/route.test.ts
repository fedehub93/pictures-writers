import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enqueueWebhookRun } from "@/modules/automations/lib/automation-triggers";

import { POST } from "./route";

vi.mock("@/modules/automations/lib/automation-triggers", () => ({
  enqueueWebhookRun: vi.fn(),
}));

describe("POST /api/automations/webhook/[automationId]", () => {
  const context = { params: Promise.resolve({ automationId: "automation-1" }) };

  const makeRequest = (secret?: string, body?: unknown) => {
    const headers = new Headers();
    if (secret) {
      headers.set("x-automation-secret", secret);
    }
    if (body !== undefined) {
      headers.set("content-type", "application/json");
    }

    return new Request("http://localhost/api/automations/webhook/automation-1", {
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when the secret is rejected", async () => {
    vi.mocked(enqueueWebhookRun).mockResolvedValue({ status: "unauthorized" });

    const response = await POST(makeRequest("wrong", { hello: "world" }), context);

    expect(response.status).toBe(401);
  });

  it("starts a Run with the request body as payload", async () => {
    vi.mocked(enqueueWebhookRun).mockResolvedValue({
      status: "accepted",
      runId: "run-1",
    });

    const response = await POST(makeRequest("secret", { hello: "world" }), context);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({ runId: "run-1" });
    expect(enqueueWebhookRun).toHaveBeenCalledWith({
      automationId: "automation-1",
      secret: "secret",
      payload: { hello: "world" },
    });
  });

  it("reports an ignored (unpublished) Run without an id", async () => {
    vi.mocked(enqueueWebhookRun).mockResolvedValue({ status: "ignored" });

    const response = await POST(makeRequest("secret", { hello: "world" }), context);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toEqual({ runId: null });
  });

  it("treats a non-JSON body as an empty payload", async () => {
    vi.mocked(enqueueWebhookRun).mockResolvedValue({
      status: "accepted",
      runId: "run-2",
    });

    const request = new Request(
      "http://localhost/api/automations/webhook/automation-1",
      { method: "POST", headers: { "x-automation-secret": "secret" }, body: "not-json" },
    );

    await POST(request, context);

    expect(enqueueWebhookRun).toHaveBeenCalledWith({
      automationId: "automation-1",
      secret: "secret",
      payload: null,
    });
  });

  it("returns 500 when enqueueing throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(enqueueWebhookRun).mockRejectedValue(new Error("database down"));

    const response = await POST(makeRequest("secret", {}), context);

    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[AUTOMATIONS_WEBHOOK]",
      expect.any(Error),
    );
  });
});
