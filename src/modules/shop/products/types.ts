import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type ProductsGetMany =
  inferRouterOutputs<AppRouter>["products"]["getMany"];

export type ProductGetOne =
  inferRouterOutputs<AppRouter>["products"]["getOne"];

export type ProductGetLastByRootId =
  inferRouterOutputs<AppRouter>["products"]["getLastByRootId"];

export type ProductsGetByRootIds =
  inferRouterOutputs<AppRouter>["products"]["getByRootIds"];
