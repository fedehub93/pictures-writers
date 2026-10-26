/**
 * Icons a product service feature is allowed to reference.
 *
 * Kept dependency-free so the Zod schema can import the names without pulling
 * the icon components (or the rest of Lucide) into a bundle.
 */
export const SERVICE_FEATURE_ICON_NAMES = [
  "ActivityIcon",
  "BookOpenIcon",
  "FileCodeIcon",
  "MessageSquareIcon",
  "PanelsTopLeftIcon",
  "TargetIcon",
  "UsersIcon",
] as const;

export type ServiceFeatureIconName =
  (typeof SERVICE_FEATURE_ICON_NAMES)[number];

export const DEFAULT_SERVICE_FEATURE_ICON_NAME: ServiceFeatureIconName =
  "FileCodeIcon";
