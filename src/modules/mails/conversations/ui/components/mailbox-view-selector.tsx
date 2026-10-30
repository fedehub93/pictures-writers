"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { type MailboxView } from "./mailbox-nav";

interface MailboxViewSelectorProps {
  view: MailboxView;
  onViewChange: (view: MailboxView) => void;
  inboxUnreadCount: number;
  archivedCount: number;
}

const VIEWS: { value: MailboxView; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "sent", label: "Sent" },
  { value: "starred", label: "Starred" },
  { value: "archived", label: "Archive" },
  { value: "trash", label: "Trash" },
];

/**
 * View switcher for the modes where the mailbox rail is not on screen. The rail
 * owns the same five views, so the two must stay in step; the counts the rail
 * shows as badges are rendered into the label here.
 */
export const MailboxViewSelector = ({
  view,
  onViewChange,
  inboxUnreadCount,
  archivedCount,
}: MailboxViewSelectorProps) => {
  const countFor = (value: MailboxView) => {
    if (value === "inbox") return inboxUnreadCount;
    if (value === "archived") return archivedCount;
    return 0;
  };

  return (
    <Select value={view} onValueChange={onViewChange}>
      <SelectTrigger className="w-full" aria-label="Mailbox view">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {VIEWS.map(({ value, label }) => {
          const count = countFor(value);

          return (
            <SelectItem key={value} value={value}>
              {count ? `${label} (${count})` : label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
