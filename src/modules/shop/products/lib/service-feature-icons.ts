import {
  Activity,
  BookOpen,
  FileCode,
  MessageSquare,
  PanelsTopLeft,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  SERVICE_FEATURE_ICON_NAMES,
  type ServiceFeatureIconName,
} from "./service-feature-icon-names";

/**
 * Explicit whitelist of the icons used by service products. Importing the
 * individual icons (instead of `import * as LucideIcons`) lets the bundler
 * tree-shake the rest of the library out of the public bundle.
 */
export const SERVICE_FEATURE_ICONS = {
  ActivityIcon: Activity,
  BookOpenIcon: BookOpen,
  FileCodeIcon: FileCode,
  MessageSquareIcon: MessageSquare,
  PanelsTopLeftIcon: PanelsTopLeft,
  TargetIcon: Target,
  UsersIcon: Users,
} as const satisfies Record<ServiceFeatureIconName, LucideIcon>;

export const DEFAULT_SERVICE_FEATURE_ICON =
  SERVICE_FEATURE_ICONS.FileCodeIcon;

export function getServiceFeatureIcon(name: string): LucideIcon {
  return (
    SERVICE_FEATURE_ICONS[name as ServiceFeatureIconName] ??
    DEFAULT_SERVICE_FEATURE_ICON
  );
}

export { SERVICE_FEATURE_ICON_NAMES, type ServiceFeatureIconName };
