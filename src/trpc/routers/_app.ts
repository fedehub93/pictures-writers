import { createTRPCRouter } from "../init";

import { singleSendsRouter } from "@/modules/mails/single-sends/server/procedures";
import { audiencesRouter } from "@/modules/mails/audiences/server/procedures";
import { contactsRouter } from "@/modules/mails/contacts/server/procedures";
import { settingsRouter } from "@/modules/mails/settings/server/procedures";
import { templatesRouter } from "@/modules/mails/templates/server/procedures";
import { formsRouter } from "@/modules/forms/server/procedures";

export const appRouter = createTRPCRouter({
  singleSends: singleSendsRouter,
  audiences: audiencesRouter,
  contacts: contactsRouter,
  mailSettings: settingsRouter,
  templates: templatesRouter,
  forms: formsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
