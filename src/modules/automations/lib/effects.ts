import type { JsonValue } from "./graph";

export type AutomationEffect = (request: JsonValue) => Promise<JsonValue>;

export type AutomationEffects = {
  mail: AutomationEffect;
  http: AutomationEffect;
  llm: AutomationEffect;
  webSearch: AutomationEffect;
};

export type InMemoryEffects = AutomationEffects & {
  mailCalls: JsonValue[];
  httpCalls: JsonValue[];
  llmCalls: JsonValue[];
  webSearchCalls: JsonValue[];
};

export function createInMemoryEffects(): InMemoryEffects {
  const mailCalls: JsonValue[] = [];
  const httpCalls: JsonValue[] = [];
  const llmCalls: JsonValue[] = [];
  const webSearchCalls: JsonValue[] = [];

  return {
    mailCalls,
    httpCalls,
    llmCalls,
    webSearchCalls,
    mail: async (request) => {
      mailCalls.push(request);
      return request;
    },
    http: async (request) => {
      httpCalls.push(request);
      return request;
    },
    llm: async (request) => {
      llmCalls.push(request);
      return request;
    },
    webSearch: async (request) => {
      webSearchCalls.push(request);
      return request;
    },
  };
}

export const passthroughEffects: AutomationEffects = {
  mail: async (request) => request,
  http: async (request) => request,
  llm: async (request) => request,
  webSearch: async (request) => request,
};

function unconfiguredEffect(name: string): AutomationEffect {
  return async () => {
    throw new Error(`${name} effect is not configured`);
  };
}

export const unconfiguredEffects: AutomationEffects = {
  mail: unconfiguredEffect("mail"),
  http: unconfiguredEffect("http"),
  llm: unconfiguredEffect("llm"),
  webSearch: unconfiguredEffect("webSearch"),
};
