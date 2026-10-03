import {
  ClipboardListIcon,
  ClockIcon,
  GlobeIcon,
  MailIcon,
  MousePointerIcon,
  PackageCheckIcon,
  PuzzleIcon,
  SearchIcon,
  ShoppingCartIcon,
  SparklesIcon,
  TimerIcon,
  UserCheckIcon,
  UserPlusIcon,
  WebhookIcon,
  type LucideIcon,
} from "lucide-react";

const nodeIcons: Record<string, LucideIcon> = {
  MANUAL_TRIGGER: MousePointerIcon,
  CRON_TRIGGER: ClockIcon,
  WEBHOOK_TRIGGER: WebhookIcon,
  FORM_SUBMITTED_TRIGGER: ClipboardListIcon,
  SUBSCRIPTION_CONFIRMED_TRIGGER: UserCheckIcon,
  ORDER_COMPLETED_TRIGGER: PackageCheckIcon,
  WAIT: TimerIcon,
  HTTP_REQUEST: GlobeIcon,
  WEB_SEARCH: SearchIcon,
  LLM: SparklesIcon,
  SEND_EMAIL: MailIcon,
  CREATE_CUSTOMER: UserPlusIcon,
  CREATE_ORDER: ShoppingCartIcon,
};

export function getNodeIcon(type: string | null | undefined): LucideIcon {
  return (type && nodeIcons[type]) || PuzzleIcon;
}
