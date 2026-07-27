import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type PagesGetMany = inferRouterOutputs<AppRouter>["pages"]["getMany"];

export type PageGetOne = inferRouterOutputs<AppRouter>["pages"]["getOne"];
