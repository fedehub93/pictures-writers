import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/trpc/routers/_app";

export type SettingsGet = inferRouterOutputs<AppRouter>["mailSettings"]["get"];
