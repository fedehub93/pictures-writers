import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type OrdersGetMany =
  inferRouterOutputs<AppRouter>["orders"]["getMany"];

export type OrderGetOne = inferRouterOutputs<AppRouter>["orders"]["getOne"];
