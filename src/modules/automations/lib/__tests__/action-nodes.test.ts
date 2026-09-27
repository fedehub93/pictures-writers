import { beforeEach, describe, expect, it } from "vitest";

import { AutomationRunStepStatus, AutomationStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { cleanupAutomationTables } from "@/modules/automations";

import { resolveHttpRequestConfig } from "../actions/http-request";
import { resolveLlmConfig } from "../actions/llm";
import {
  buildHttpProviderRequest,
  buildLlmProviderRequest,
  buildWebSearchProviderRequest,
  extractLlmText,
  extractWebSearchResults,
} from "../actions/providers";
import { MissingActionConfigError } from "../actions/shared";
import { resolveWebSearchConfig } from "../actions/web-search";
import { enqueueRun } from "../automation-ingestion";
import { runDueAutomations } from "../automation-runner";
import { createInMemoryEffects } from "../effects";
import type { AutomationInterpolationContext } from "../interpolate";

const context: AutomationInterpolationContext = {
  input: { name: "Ada", topic: "AI" },
  payload: { email: "ada@example.com", name: "Ada", slug: "welcome" },
  run: { id: "run-1", triggerType: "manual" },
  step: { id: "step-1", attempts: 0 },
};

describe("action config resolvers", () => {
  it("interpolates HTTP method, URL, headers and body", () => {
    const config = resolveHttpRequestConfig(
      {
        method: "post",
        url: "https://api.example.test/{{ payload.slug }}",
        headers: { "X-Trace": "{{ input.name }}", Accept: "application/json" },
        body: { name: "{{ payload.name }}" },
      },
      context,
    );

    expect(config).toEqual({
      method: "POST",
      url: "https://api.example.test/welcome",
      headers: { "X-Trace": "Ada", Accept: "application/json" },
      body: { name: "Ada" },
    });
  });

  it("defaults the HTTP method to GET and drops GET bodies", () => {
    const config = resolveHttpRequestConfig(
      { url: "https://api.example.test", body: "ignored" },
      context,
    );

    expect(config).toEqual({
      method: "GET",
      url: "https://api.example.test",
    });
  });

  it("parses headers authored as a JSON string", () => {
    const config = resolveHttpRequestConfig(
      { url: "https://api.example.test", headers: '{"X-Key": "abc"}' },
      context,
    );

    expect(config.headers).toEqual({ "X-Key": "abc" });
  });

  it("rejects an HTTP node without a valid URL or method", () => {
    expect(() => resolveHttpRequestConfig({ method: "GET" }, context)).toThrow(
      MissingActionConfigError,
    );
    expect(() =>
      resolveHttpRequestConfig({ url: "not-a-url" }, context),
    ).toThrow(MissingActionConfigError);
    expect(() =>
      resolveHttpRequestConfig(
        { url: "https://api.example.test", method: "FLY" },
        context,
      ),
    ).toThrow(MissingActionConfigError);
  });

  it("interpolates the web search query and defaults the provider", () => {
    const config = resolveWebSearchConfig(
      { query: "news about {{ input.topic }}", maxResults: "5" },
      context,
    );

    expect(config).toEqual({
      provider: "tavily",
      query: "news about AI",
      maxResults: 5,
    });
  });

  it("rejects a web search node without a query or with an unknown provider", () => {
    expect(() => resolveWebSearchConfig({}, context)).toThrow(
      MissingActionConfigError,
    );
    expect(() =>
      resolveWebSearchConfig({ query: "x", provider: "altavista" }, context),
    ).toThrow(MissingActionConfigError);
  });

  it("interpolates the LLM prompt and validates model/provider", () => {
    const config = resolveLlmConfig(
      {
        model: "gpt-4o-mini",
        system: "You write for {{ payload.name }}",
        prompt: "Summarise {{ input.topic }}",
        temperature: 0.4,
        baseUrl: "https://gateway.example.test/v1/",
      },
      context,
    );

    expect(config).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
      system: "You write for Ada",
      prompt: "Summarise AI",
      temperature: 0.4,
      baseUrl: "https://gateway.example.test/v1/",
    });

    expect(() => resolveLlmConfig({ model: "gpt-4o-mini" }, context)).toThrow(
      MissingActionConfigError,
    );
    expect(() =>
      resolveLlmConfig({ prompt: "hi", model: "gpt-4o-mini", provider: "claude" }, context),
    ).toThrow(MissingActionConfigError);
  });
});

describe("provider request shaping", () => {
  it("attaches the credential as a bearer token unless already set", () => {
    const withSecret = buildHttpProviderRequest(
      { method: "GET", url: "https://api.example.test" },
      "token-123",
    );
    expect(withSecret.headers.Authorization).toBe("Bearer token-123");

    const explicit = buildHttpProviderRequest(
      {
        method: "POST",
        url: "https://api.example.test",
        headers: { authorization: "ApiKey xyz" },
      },
      "token-123",
    );
    expect(explicit.headers.authorization).toBe("ApiKey xyz");
    expect(explicit.headers.Authorization).toBeUndefined();
  });

  it("sets a JSON content type for object bodies unless overridden", () => {
    const json = buildHttpProviderRequest({
      method: "POST",
      url: "https://api.example.test",
      body: { name: "Ada" },
    });
    expect(json.headers["Content-Type"]).toBe("application/json");

    const overridden = buildHttpProviderRequest({
      method: "POST",
      url: "https://api.example.test",
      headers: { "content-type": "text/plain" },
      body: { name: "Ada" },
    });
    expect(overridden.headers["content-type"]).toBe("text/plain");
    expect(overridden.headers["Content-Type"]).toBeUndefined();
  });

  it("shapes each web search provider's request with the credential", () => {
    const tavily = buildWebSearchProviderRequest(
      { provider: "tavily", query: "ai", maxResults: 3 },
      "tavily-key",
    );
    expect(tavily).toMatchObject({
      url: "https://api.tavily.com/search",
      method: "POST",
      body: { api_key: "tavily-key", query: "ai", max_results: 3 },
    });

    const brave = buildWebSearchProviderRequest(
      { provider: "brave", query: "ai news" },
      "brave-key",
    );
    expect(brave.method).toBe("GET");
    expect(brave.url).toContain("q=ai+news");
    expect(brave.headers["X-Subscription-Token"]).toBe("brave-key");

    const serper = buildWebSearchProviderRequest(
      { provider: "serper", query: "ai" },
      "serper-key",
    );
    expect(serper.headers["X-API-KEY"]).toBe("serper-key");
  });

  it("requires a credential for web search and LLM", () => {
    expect(() =>
      buildWebSearchProviderRequest({ provider: "tavily", query: "ai" }),
    ).toThrow(MissingActionConfigError);
    expect(() =>
      buildLlmProviderRequest({ provider: "openai", model: "m", prompt: "p" }),
    ).toThrow(MissingActionConfigError);
  });

  it("shapes an OpenAI-compatible chat completion", () => {
    const request = buildLlmProviderRequest(
      {
        provider: "openai",
        model: "gpt-4o-mini",
        system: "Be brief",
        prompt: "Hello",
        temperature: 0.2,
      },
      "llm-key",
    );

    expect(request.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(request.headers.Authorization).toBe("Bearer llm-key");
    expect(request.body).toMatchObject({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Be brief" },
        { role: "user", content: "Hello" },
      ],
    });
  });

  it("extracts results and assistant text from provider responses", () => {
    expect(
      extractWebSearchResults("tavily", { results: [{ title: "a" }] }),
    ).toEqual([{ title: "a" }]);
    expect(
      extractWebSearchResults("brave", { web: { results: [{ title: "b" }] } }),
    ).toEqual([{ title: "b" }]);
    expect(extractWebSearchResults("serper", { organic: [{ title: "c" }] })).toEqual(
      [{ title: "c" }],
    );

    expect(
      extractLlmText({ choices: [{ message: { content: "hi" } }] }),
    ).toBe("hi");
    expect(extractLlmText({})).toBeNull();
  });
});

describe("general-purpose action nodes", () => {
  beforeEach(async () => {
    await cleanupAutomationTables();
  });

  async function runGraph(
    graph: unknown,
    payload: Record<string, unknown>,
    effects: ReturnType<typeof createInMemoryEffects>,
    pumps = 3,
  ) {
    const automation = await db.automation.create({
      data: {
        name: "Action flow",
        status: AutomationStatus.PUBLISHED,
        publishedSnapshot: graph as object,
      },
    });
    const run = await enqueueRun({
      automationId: automation.id,
      triggerType: "manual",
      payload,
    });

    for (let i = 0; i < pumps; i++) {
      await runDueAutomations({ effects });
    }

    return { automation, run };
  }

  it("executes a templated HTTP Request with a credential and exposes the response downstream", async () => {
    const effects = createInMemoryEffects();
    const { run } = await runGraph(
      {
        nodes: [
          { id: "trigger", type: "manual", data: {} },
          {
            id: "request",
            type: "httpRequest",
            data: {
              method: "POST",
              url: "https://api.example.test/{{ payload.slug }}",
              headers: { "X-Trace": "{{ input.name }}" },
              body: { name: "{{ payload.name }}" },
            },
            credentialId: "cred-1",
          },
          { id: "end", type: "end", data: {} },
        ],
        connections: [
          { fromNodeId: "trigger", toNodeId: "request" },
          { fromNodeId: "request", toNodeId: "end" },
        ],
      },
      { name: "Ada", slug: "welcome" },
      effects,
    );

    expect(effects.httpCalls).toHaveLength(1);
    expect(effects.httpCalls[0]).toMatchObject({
      credentialId: "cred-1",
      run: { id: run!.id, triggerType: "manual" },
      config: {
        method: "POST",
        url: "https://api.example.test/welcome",
        headers: { "X-Trace": "Ada" },
        body: { name: "Ada" },
      },
    });

    const requestStep = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "request" },
    });
    expect(requestStep?.status).toBe(AutomationRunStepStatus.COMPLETED);

    const endStep = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "end" },
    });
    expect(endStep?.input).toMatchObject({ config: { url: "https://api.example.test/welcome" } });

    const completed = await db.automationRun.findUnique({
      where: { id: run!.id },
    });
    expect(completed?.status).toBe("COMPLETED");
  });

  it("runs Web Search and LLM nodes through their effects", async () => {
    const effects = createInMemoryEffects();
    const { run } = await runGraph(
      {
        nodes: [
          { id: "trigger", type: "manual", data: {} },
          {
            id: "search",
            type: "webSearch",
            data: { provider: "brave", query: "{{ payload.topic }}" },
            credentialId: "search-cred",
          },
          {
            id: "llm",
            type: "llm",
            data: {
              model: "gpt-4o-mini",
              prompt: "Summarise {{ input }}",
            },
          },
        ],
        connections: [
          { fromNodeId: "trigger", toNodeId: "search" },
          { fromNodeId: "search", toNodeId: "llm" },
        ],
      },
      { topic: "ai" },
      effects,
    );

    expect(effects.webSearchCalls).toHaveLength(1);
    expect(effects.webSearchCalls[0]).toMatchObject({
      credentialId: "search-cred",
      config: { provider: "brave", query: "ai" },
    });

    expect(effects.llmCalls).toHaveLength(1);
    expect(effects.llmCalls[0]).toMatchObject({
      config: { provider: "openai", model: "gpt-4o-mini" },
    });

    const llmStep = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "llm" },
    });
    expect(llmStep?.status).toBe(AutomationRunStepStatus.COMPLETED);
  });

  it("fails the step and run when an action is misconfigured", async () => {
    const effects = createInMemoryEffects();
    const { run } = await runGraph(
      {
        nodes: [
          { id: "trigger", type: "manual", data: {} },
          { id: "request", type: "httpRequest", data: { url: "" } },
        ],
        connections: [{ fromNodeId: "trigger", toNodeId: "request" }],
      },
      {},
      effects,
      2,
    );

    expect(effects.httpCalls).toHaveLength(0);

    const step = await db.automationRunStep.findFirst({
      where: { runId: run!.id, nodeId: "request" },
    });
    expect(step?.status).toBe(AutomationRunStepStatus.FAILED);
    expect(step?.error).toMatch(/missing a URL/i);

    const failed = await db.automationRun.findUnique({ where: { id: run!.id } });
    expect(failed?.status).toBe("FAILED");
  });
});
