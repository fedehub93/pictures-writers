import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

export type EmailAccountsGetMany =
  inferRouterOutputs<AppRouter>["emailAccounts"]["getMany"];

export type EmailAccountGetOne =
  inferRouterOutputs<AppRouter>["emailAccounts"]["getOne"];

export type EmailAccountGetManyRow = EmailAccountsGetMany[number];

export type EmailAccountAllowed =
  inferRouterOutputs<AppRouter>["emailAccounts"]["getAllowed"][number];
