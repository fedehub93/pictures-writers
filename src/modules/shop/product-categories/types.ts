import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type ProductCategoriesGetMany =
  inferRouterOutputs<AppRouter>["productCategories"]["getMany"];

export type ProductCategoryGetOne =
  inferRouterOutputs<AppRouter>["productCategories"]["getOne"];
