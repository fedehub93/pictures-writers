import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type FormsGetMany =
  inferRouterOutputs<AppRouter>["forms"]["getMany"]["items"];

export type FormGetOne = inferRouterOutputs<AppRouter>["forms"]["getOne"];
