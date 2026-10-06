import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type CustomersGetMany =
  inferRouterOutputs<AppRouter>["customers"]["getMany"];

export type CustomerGetOne =
  inferRouterOutputs<AppRouter>["customers"]["getOne"];
