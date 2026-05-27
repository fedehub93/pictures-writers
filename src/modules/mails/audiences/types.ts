import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

export type AudiencesGetMany =
  inferRouterOutputs<AppRouter>["audiences"]["getMany"];

export type AudienceGetOne =
  inferRouterOutputs<AppRouter>["audiences"]["getOne"];
