import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enqueueDueCronAutomations } from "@/modules/automations/lib/automation-triggers";
import { pumpDueAutomations } from "@/modules/automations/server/automation-runtime";

import { POST } from "./route";

vi.mock("@/modules/automations/server/automation-runtime", () => ({
  pumpDueAutomations: vi.fn(),
}));

vi.mock("@/modules/automations/lib/automation-triggers", () => ({
  enqueueDueCronAutomations: vi.fn(),
}));

describe("POST /api/automations/run", () => {
  const originalSecret = process.env.SCHEDULED_PUBLICATION_SECRET;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(enqueueDueCronAutomations).mockResolvedValue({ fired: [] });
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

    return new Request("http://localhost/api/automations/run/", {
      method: "POST",
      headers,
    });
  };

  it("returns 401 when the secret header is missing", async () => {
    const response = await POST(makeRequest());

    expect(response.status).toBe(401);
    expect(pumpDueAutomations).not.toHaveBeenCalled();
  });

  it("returns 401 when the secret header is invalid", async () => {
    const response = await POST(makeRequest("wrong-secret"));

    expect(response.status).toBe(401);
    expect(pumpDueAutomations).not.toHaveBeenCalled();
  });

  it("runs due automations for a valid secret", async () => {
    vi.mocked(pumpDueAutomations).mockResolvedValue({
      batches: 1,
      processed: 1,
      succeeded: 1,
      failed: 0,
      skipped: 0,
    });

    const response = await POST(makeRequest("test-secret"));
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result).toMatchObject({
      processed: 1,
      succeeded: 1,
      failed: 0,
      skipped: 0,
    });
    expect(enqueueDueCronAutomations).toHaveBeenCalledTimes(1);
    expect(pumpDueAutomations).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the runner throws", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(pumpDueAutomations).mockRejectedValue(new Error("database down"));

    const response = await POST(makeRequest("test-secret"));

    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[AUTOMATIONS_RUN]",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });
});
