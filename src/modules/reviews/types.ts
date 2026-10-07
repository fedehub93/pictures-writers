import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type ReviewsGetMany = inferRouterOutputs<AppRouter>["reviews"]["getMany"];
