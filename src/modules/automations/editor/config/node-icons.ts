import {
  GlobeIcon,
  MailIcon,
  MousePointerIcon,
  PuzzleIcon,
  type LucideIcon,
} from "lucide-react";

const nodeIcons: Record<string, LucideIcon> = {
  MANUAL_TRIGGER: MousePointerIcon,
  HTTP_REQUEST: GlobeIcon,
  SEND_EMAIL: MailIcon,
};

export function getNodeIcon(type: string | null | undefined): LucideIcon {
  return (type && nodeIcons[type]) || PuzzleIcon;
}
