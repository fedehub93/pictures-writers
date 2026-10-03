import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type FormSubmissionsGetMany =
  inferRouterOutputs<AppRouter>["submissions"]["getMany"]["items"];

export type FormSubmissionGetOne =
  inferRouterOutputs<AppRouter>["submissions"]["getOne"];
