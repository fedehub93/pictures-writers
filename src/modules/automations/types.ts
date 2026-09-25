import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type AutomationsGetMany =
  inferRouterOutputs<AppRouter>["automations"]["getMany"];