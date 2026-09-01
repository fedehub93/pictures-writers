import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { publishDuePosts } from "@/modules/blog/posts/lib/publish-due-posts";

import { POST } from "./route";

vi.mock("@/modules/blog/posts/lib/publish-due-posts", () => ({
  publishDuePosts: vi.fn(),
}));

describe("POST /api/admin/posts/publish-scheduled", () => {
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

    return new Request("http://localhost/api/admin/posts/publish-scheduled/", {
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

  it("returns 200 with publication results when the secret is valid", async () => {
    vi.mocked(publishDuePosts).mockResolvedValue({
      processed: 2,
      succeeded: 2,
      failed: 0,
      skipped: 0,
      details: [
        { postId: "post-1", rootId: "root-1", status: "published" },
        { postId: "post-2", rootId: "root-2", status: "published" },
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
    expect(publishDuePosts).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the publication workflow throws", async () => {
    vi.mocked(publishDuePosts).mockRejectedValue(new Error("database down"));

    const res = await POST(makeRequest("test-secret"));

    expect(res.status).toBe(500);
  });
});
