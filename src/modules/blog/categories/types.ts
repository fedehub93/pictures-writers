import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type CategoriesGetMany =
  inferRouterOutputs<AppRouter>["categories"]["getMany"];

export type CategoryGetOne =
  inferRouterOutputs<AppRouter>["categories"]["getOne"];

export type CategoryGetLastByRootId =
  inferRouterOutputs<AppRouter>["categories"]["getLastByRootId"];
