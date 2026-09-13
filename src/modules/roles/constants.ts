export const ADMIN_ROLE_KEY = "ADMIN";

export const REQUIRED_ADMIN_PERMISSIONS = [
  "roles.read",
  "roles.manage",
  "users.manage",
] as const;
