import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type PostsGetMany = inferRouterOutputs<AppRouter>["posts"]["getMany"];

export type PostGetOne = inferRouterOutputs<AppRouter>["posts"]["getOne"];

export type PostGetLastByRootId =
  inferRouterOutputs<AppRouter>["posts"]["getLastByRootId"];
