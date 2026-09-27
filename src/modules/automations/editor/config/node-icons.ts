import {
  ClipboardListIcon,
  ClockIcon,
  GlobeIcon,
  MailIcon,
  MousePointerIcon,
  PuzzleIcon,
  SearchIcon,
  SparklesIcon,
  WebhookIcon,
  type LucideIcon,
} from "lucide-react";

const nodeIcons: Record<string, LucideIcon> = {
  MANUAL_TRIGGER: MousePointerIcon,
  CRON_TRIGGER: ClockIcon,
  WEBHOOK_TRIGGER: WebhookIcon,
  FORM_SUBMITTED_TRIGGER: ClipboardListIcon,
  HTTP_REQUEST: GlobeIcon,
  WEB_SEARCH: SearchIcon,
  LLM: SparklesIcon,
  SEND_EMAIL: MailIcon,
};

export function getNodeIcon(type: string | null | undefined): LucideIcon {
  return (type && nodeIcons[type]) || PuzzleIcon;
}
