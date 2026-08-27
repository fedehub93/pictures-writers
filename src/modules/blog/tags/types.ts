import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type TagsGetMany = inferRouterOutputs<AppRouter>["tags"]["getMany"];

export type TagGetOne = inferRouterOutputs<AppRouter>["tags"]["getOne"];

export type TagGetLastByRootId =
  inferRouterOutputs<AppRouter>["tags"]["getLastByRootId"];
