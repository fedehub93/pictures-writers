import { createTRPCRouter } from "../init";

import { audiencesRouter } from "@/modules/mails/audiences/server/procedures";
import { automationsRouter } from "@/modules/automations/server/procedures";
import { credentialsRouter } from "@/modules/automations/credentials/server/procedures";
import { categoriesRouter } from "@/modules/blog/categories/server/procedures";
import { customersRouter } from "@/modules/shop/customers/server/procedures";
import { contactsRouter } from "@/modules/mails/contacts/server/procedures";
import { formsRouter } from "@/modules/forms/server/procedures";
import { formSubmissionsRouter } from "@/modules/forms/submissions/server/procedures";
import { ordersRouter } from "@/modules/shop/orders/server/procedures";
import { productCategoriesRouter } from "@/modules/shop/product-categories/server/procedures";
import { pagesRouter } from "@/modules/pages/server/procedures";
import { postsRouter } from "@/modules/blog/posts/server/procedures";
import { reviewsRouter } from "@/modules/reviews/server/procedures";
import { schedulerRouter } from "@/modules/scheduler/server/procedures";
import { settingsRouter } from "@/modules/mails/settings/server/procedures";
import { singleSendsRouter } from "@/modules/mails/single-sends/server/procedures";
import { tagsRouter } from "@/modules/blog/tags/server/procedures";
import { templatesRouter } from "@/modules/mails/templates/server/procedures";
import { rolesRouter } from "@/modules/roles/server/procedures";
import { usersRouter } from "@/modules/users/server/procedures";

export const appRouter = createTRPCRouter({
  audiences: audiencesRouter,
  automations: automationsRouter,
  credentials: credentialsRouter,
  categories: categoriesRouter,
  contacts: contactsRouter,
  customers: customersRouter,
  forms: formsRouter,
  mailSettings: settingsRouter,
  orders: ordersRouter,
  pages: pagesRouter,
  posts: postsRouter,
  productCategories: productCategoriesRouter,
  reviews: reviewsRouter,
  roles: rolesRouter,
  users: usersRouter,
  scheduler: schedulerRouter,
  singleSends: singleSendsRouter,
  submissions: formSubmissionsRouter,
  tags: tagsRouter,
  templates: templatesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
