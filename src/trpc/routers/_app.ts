import { createTRPCRouter } from "../init";

import { audiencesRouter } from "@/modules/mails/audiences/server/procedures";
import { categoriesRouter } from "@/modules/blog/categories/server/procedures";
import { contactsRouter } from "@/modules/mails/contacts/server/procedures";
import { formsRouter } from "@/modules/forms/server/procedures";
import { formSubmissionsRouter } from "@/modules/forms/submissions/server/procedures";
import { pagesRouter } from "@/modules/pages/server/procedures";
import { postsRouter } from "@/modules/blog/posts/server/procedures";
import { schedulerRouter } from "@/modules/scheduler/server/procedures";
import { settingsRouter } from "@/modules/mails/settings/server/procedures";
import { singleSendsRouter } from "@/modules/mails/single-sends/server/procedures";
import { tagsRouter } from "@/modules/blog/tags/server/procedures";
import { templatesRouter } from "@/modules/mails/templates/server/procedures";

export const appRouter = createTRPCRouter({
  audiences: audiencesRouter,
  categories: categoriesRouter,
  contacts: contactsRouter,
  forms: formsRouter,
  mailSettings: settingsRouter,
  pages: pagesRouter,
  posts: postsRouter,
  scheduler: schedulerRouter,
  singleSends: singleSendsRouter,
  submissions: formSubmissionsRouter,
  tags: tagsRouter,
  templates: templatesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
