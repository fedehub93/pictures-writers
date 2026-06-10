import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

export type TemplatesGetMany =
  inferRouterOutputs<AppRouter>["templates"]["getMany"];

export type TemplateGetOne =
  inferRouterOutputs<AppRouter>["templates"]["getOne"];
