import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type AutomationsGetMany =
  inferRouterOutputs<AppRouter>["automations"]["getMany"];

export type AutomationsGetRuns =
  inferRouterOutputs<AppRouter>["automations"]["getRuns"];

export type AutomationsGetRun =
  inferRouterOutputs<AppRouter>["automations"]["getRun"];
