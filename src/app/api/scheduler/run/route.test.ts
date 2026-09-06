import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { runScheduledActions } from "@/modules/scheduler/lib/scheduler-runner";
import { triggerWebhookBuild } from "@/lib/vercel";

import { POST } from "./route";

vi.mock("@/modules/scheduler/lib/scheduler-runner", () => ({
  runScheduledActions: vi.fn(),
}));

vi.mock("@/lib/vercel", () => ({
  triggerWebhookBuild: vi.fn(),
}));

describe("POST /api/scheduler/run", () => {
  const originalSecret = process.env.SCHEDULED_PUBLICATION_SECRET;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.SCHEDULED_PUBLICATION_SECRET = "test-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.SCHEDULED_PUBLICATION_SECRET;
    } else {
      process.env.SCHEDULED_PUBLICATION_SECRET = originalSecret;
    }
  });

  const makeRequest = (secret?: string) => {
    const headers = new Headers();
    if (secret) {
      headers.set("x-scheduled-publication-secret", secret);
    }

    return new Request("http://localhost/api/scheduler/run/", {
      method: "POST",
      headers,
    });
  };

  it("returns 401 when the secret header is missing", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when the secret header is invalid", async () => {
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 200 with worker results and triggers a build when a Post is published", async () => {
    vi.mocked(runScheduledActions).mockResolvedValue({
      processed: 2,
      succeeded: 2,
      failed: 0,
      skipped: 0,
      details: [
        {
          actionId: "action-1",
          type: "PUBLISH_POST",
          targetId: "root-1",
          status: "succeeded",
        },
        {
          actionId: "action-2",
          type: "SEND_EMAIL",
          targetId: "send-1",
          status: "succeeded",
        },
      ],
    });

    const res = await POST(makeRequest("test-secret"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({
      processed: 2,
      succeeded: 2,
      failed: 0,
      skipped: 0,
    });
    expect(runScheduledActions).toHaveBeenCalledTimes(1);
    expect(triggerWebhookBuild).toHaveBeenCalledTimes(1);
  });

  it("does not trigger a build when only newsletter actions succeeded", async () => {
    vi.mocked(runScheduledActions).mockResolvedValue({
      processed: 1,
      succeeded: 1,
      failed: 0,
      skipped: 0,
      details: [
        {
          actionId: "action-2",
          type: "SEND_EMAIL",
          targetId: "send-1",
          status: "succeeded",
        },
      ],
    });

    const res = await POST(makeRequest("test-secret"));

    expect(res.status).toBe(200);
    expect(triggerWebhookBuild).not.toHaveBeenCalled();
  });

  it("returns 500 when the worker throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(runScheduledActions).mockRejectedValue(new Error("database down"));

    const res = await POST(makeRequest("test-secret"));

    expect(res.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[SCHEDULER_RUN]",
      expect.any(Error),
    );
    expect(triggerWebhookBuild).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});