import { inferRouterOutputs } from "@trpc/server";
import { inferInput } from "@trpc/tanstack-react-query";

import { AppRouter } from "@/trpc/routers/_app";
import { trpc } from "@/trpc/server";

export type ContactsGetManyInput = inferInput<typeof trpc.contacts.getMany>;
export type ContactsGrowthInput = inferInput<typeof trpc.contacts.getContactsGrowth>;

export type ContactsGetMany =
  inferRouterOutputs<AppRouter>["contacts"]["getMany"];

export type ContactGetOne = inferRouterOutputs<AppRouter>["contacts"]["getOne"];

export type GrowthStats = {
  currentMonthCount: number;
  lastMonthCount: number;
  absoluteGrowth: number;
  percentageGrowth: number;
  chartData?: any;
};
