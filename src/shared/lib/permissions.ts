export const PERMISSIONS = {
  DASHBOARD_READ: "dashboard.read",
  ROLES_READ: "roles.read",
  ROLES_MANAGE: "roles.manage",
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",
  USERS_MANAGE: "users.manage",
  POSTS_READ: "posts.read",
  POSTS_CREATE: "posts.create",
  POSTS_UPDATE: "posts.update",
  POSTS_DELETE: "posts.delete",
  POSTS_PUBLISH: "posts.publish",
  CATEGORIES_READ: "categories.read",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_UPDATE: "categories.update",
  CATEGORIES_DELETE: "categories.delete",
  CATEGORIES_PUBLISH: "categories.publish",
  TAGS_READ: "tags.read",
  TAGS_CREATE: "tags.create",
  TAGS_UPDATE: "tags.update",
  TAGS_DELETE: "tags.delete",
  TAGS_PUBLISH: "tags.publish",
  PAGES_READ: "pages.read",
  PAGES_CREATE: "pages.create",
  PAGES_UPDATE: "pages.update",
  PAGES_DELETE: "pages.delete",
  PAGES_PUBLISH: "pages.publish",
  PRODUCTS_READ: "products.read",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",
  PRODUCTS_PUBLISH: "products.publish",
  MEDIA_READ: "media.read",
  MEDIA_CREATE: "media.create",
  MEDIA_UPDATE: "media.update",
  MEDIA_DELETE: "media.delete",
  AUTHORS_READ: "authors.read",
  REVIEWS_READ: "reviews.read",
  REVIEWS_MANAGE: "reviews.manage",
  PRODUCT_CATEGORIES_READ: "product-categories.read",
  PRODUCT_CATEGORIES_CREATE: "product-categories.create",
  PRODUCT_CATEGORIES_UPDATE: "product-categories.update",
  PRODUCT_CATEGORIES_DELETE: "product-categories.delete",
  SUBMISSIONS_READ: "submissions.read",
  SUBMISSIONS_DELETE: "submissions.delete",
  COVERAGE_READ: "coverage.read",
  COVERAGE_MANAGE: "coverage.manage",
  AUDIENCES_READ: "audiences.read",
  AUDIENCES_MANAGE: "audiences.manage",
  CONTACTS_READ: "contacts.read",
  CONTACTS_MANAGE: "contacts.manage",
  TEMPLATES_READ: "templates.read",
  TEMPLATES_MANAGE: "templates.manage",
  SINGLE_SENDS_READ: "single-sends.read",
  SINGLE_SENDS_MANAGE: "single-sends.manage",
  EMAIL_SETTINGS_READ: "email-settings.read",
  EMAIL_SETTINGS_MANAGE: "email-settings.manage",
  SETTINGS_READ: "settings.read",
  SETTINGS_UPDATE: "settings.update",
  WIDGETS_READ: "widgets.read",
  WIDGETS_MANAGE: "widgets.manage",
  ADS_READ: "ads.read",
  ADS_MANAGE: "ads.manage",
  CAMPAIGNS_READ: "campaigns.read",
  CAMPAIGNS_MANAGE: "campaigns.manage",
  AD_CAMPAIGNS_READ: "ad-campaigns.read",
  AD_CAMPAIGNS_MANAGE: "ad-campaigns.manage",
  AD_BLOCKS_MANAGE: "ad-blocks.manage",
  AD_ITEMS_MANAGE: "ad-items.manage",
  LANGUAGES_READ: "languages.read",
  LANGUAGES_MANAGE: "languages.manage",
  FORMS_READ: "forms.read",
  FORMS_MANAGE: "forms.manage",
  MAIL_READ: "mail.read",
  MAIL_MANAGE: "mail.manage",
} as const;

export type PermissionKey = string;

export const hasPermission = (
  permissionKeys: readonly string[],
  requiredPermission: string,
) => permissionKeys.includes(requiredPermission);

const AREA_ALIASES: Record<string, string> = {
  mailSettings: "email-settings",
  submissions: "submissions",
  singleSends: "single-sends",
  productCategories: "product-categories",
  scheduler: "posts",
};

const READ_OPERATIONS = new Set([
  "get",
  "getMany",
  "getOne",
  "getLastByRootId",
  "getPublishedByIds",
  "getPaginated",
  "getCalendarEvents",
  "getCatalog",
  "getFilteredContactCount",
  "getContactCount",
  "getContactsGrowth",
]);

export const getProcedurePermission = (path: string): string => {
  const [rawArea, operation = ""] = path.split(".");
  const area = AREA_ALIASES[rawArea] ?? rawArea;

  if (READ_OPERATIONS.has(operation) || operation.startsWith("get")) {
    return `${area}.read`;
  }
  if (
    ["publish", "unpublish"].includes(operation) ||
    (area === "posts" && ["schedule", "reschedule", "cancelSchedule"].includes(operation))
  ) {
    return `${area}.publish`;
  }
  if (operation.startsWith("create")) {
    return `${area}.create`;
  }
  if (operation.startsWith("update")) {
    return `${area}.update`;
  }
  if (operation.startsWith("remove") || operation.startsWith("delete")) {
    return `${area}.delete`;
  }

  return `${area}.manage`;
};

export const getProcedurePermissions = (path: string) => {
  const required = getProcedurePermission(path);
  return getPermissionAlternatives(required);
};

export const getPermissionAlternatives = (permission: PermissionKey) => {
  const [area, action] = permission.split(".");
  return action === "read" || action === "publish"
    ? [permission]
    : [...new Set([permission, `${area}.manage`])];
};
