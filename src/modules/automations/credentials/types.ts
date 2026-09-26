import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type CredentialsGetMany = inferRouterOutputs<AppRouter>["credentials"]["getMany"];
export type CredentialGetOne = inferRouterOutputs<AppRouter>["credentials"]["getOne"];
