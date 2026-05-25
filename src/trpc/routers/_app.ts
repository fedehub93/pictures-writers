import { createTRPCRouter } from "../init";
import { singleSendsRouter } from "@/modules/mails/single-sends/server/procedures";
export const appRouter = createTRPCRouter({
  singleSends: singleSendsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
