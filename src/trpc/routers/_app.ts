import { createTRPCRouter } from "../init";

import { singleSendsRouter } from "@/modules/mails/single-sends/server/procedures";
import { audiencesRouter } from "@/modules/mails/audiences/server/procedures";

export const appRouter = createTRPCRouter({
  singleSends: singleSendsRouter,
  audiences: audiencesRouter
});
// export type definition of API
export type AppRouter = typeof appRouter;
