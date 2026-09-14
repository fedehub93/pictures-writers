export const ADMIN_ROLE_KEY = "ADMIN";

export const REQUIRED_ADMIN_PERMISSIONS = [
  "roles.read",
  "roles.manage",
  "users.manage",
] as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;