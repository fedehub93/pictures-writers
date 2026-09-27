import { describe, expect, it, vi } from "vitest";

import { AutomationNodeError } from "@/modules/automations/lib/node-registry";

import {
  createAutomationHttpEffect,
  createAutomationLlmEffect,
  createAutomationWebSearchEffect,
} from "../action-effects";

describe("action effects", () => {
  it("resolves the credential at the boundary and injects it into the request", async () => {
    const transport = vi.fn(async () => ({ ok: true }));
    const effect = createAutomationHttpEffect({
      transport,
      resolveCredentialSecret: async () => "secret-token",
    });

    const result = await effect({
      config: { method: "GET", url: "https://api.example.test" },
      credentialId: "cred-1",
    });

    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.example.test",
        method: "GET",
        headers: { Authorization: "Bearer secret-token" },
      }),
    );
    expect(result).toEqual({ ok: true });
  });

  it("does not require a credential for HTTP requests", async () => {
    const transport = vi.fn(async () => ({ ok: true }));
    const effect = createAutomationHttpEffect({ transport });

    await effect({
      config: { method: "GET", url: "https://api.example.test" },
      credentialId: null,
    });

    expect(transport).toHaveBeenCalledWith(
      expect.objectContaining({ headers: {} }),
    );
  });

  it("returns web search results as the node output", async () => {
    const effect = createAutomationWebSearchEffect({
      transport: async () => ({ results: [{ title: "one" }] }),
      resolveCredentialSecret: async () => "search-key",
    });

    const result = await effect({
      config: { provider: "tavily", query: "ai" },
      credentialId: "cred-search",
    });

    expect(result).toEqual([{ title: "one" }]);
  });

  it("returns the assistant text as the node output", async () => {
    const effect = createAutomationLlmEffect({
      transport: async () => ({
        choices: [{ message: { content: "hello world" } }],
      }),
      resolveCredentialSecret: async () => "llm-key",
    });

    const result = await effect({
      config: { provider: "openai", model: "gpt-4o-mini", prompt: "hi" },
      credentialId: "cred-llm",
    });

    expect(result).toBe("hello world");
  });

  it("fails when the LLM provider returns no text", async () => {
    const effect = createAutomationLlmEffect({
      transport: async () => ({ choices: [] }),
      resolveCredentialSecret: async () => "llm-key",
    });

    await expect(
      effect({
        config: { provider: "openai", model: "gpt-4o-mini", prompt: "hi" },
        credentialId: "cred-llm",
      }),
    ).rejects.toBeInstanceOf(AutomationNodeError);
  });

  it("fails permanently when a required credential is missing", async () => {
    const effect = createAutomationWebSearchEffect({
      transport: async () => ({}),
      resolveCredentialSecret: async () => null,
    });

    await expect(
      effect({ config: { provider: "tavily", query: "ai" }, credentialId: null }),
    ).rejects.toBeInstanceOf(AutomationNodeError);
  });
});
