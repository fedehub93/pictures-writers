"use client";

import {
  ArchiveIcon,
  InboxIcon,
  PenSquareIcon,
  SendIcon,
  StarIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { type EmailAccountAllowed } from "@/modules/mails/accounts/types";

import { type ConversationView } from "../../schemas";
import { AccountSelector } from "./account-selector";

/** UI views include Sent, which is a message list rather than a conversation list. */
export type MailboxView = ConversationView | "sent";

interface MailboxNavProps {
  accounts: EmailAccountAllowed[];
  accountId?: string;
  onAccountChange: (id: string) => void;
  view: MailboxView;
  onViewChange: (view: MailboxView) => void;
  inboxUnreadCount: number;
  archivedCount: number;
  onCompose: () => void;
  className?: string;
}

export const MailboxNav = ({
  accounts,
  accountId,
  onAccountChange,
  view,
  onViewChange,
  inboxUnreadCount,
  archivedCount,
  onCompose,
  className,
}: MailboxNavProps) => {
  return (
    <aside
      className={cn(
        "hidden w-[280px] shrink-0 flex-col gap-5 overflow-y-auto p-3 lg:flex",
        className,
      )}
      aria-label="Mailbox"
    >
      <Button
        type="button"
        className="w-full justify-center"
        onClick={onCompose}
      >
        <PenSquareIcon className="size-4" />
        Compose
      </Button>

      <div className="flex flex-col gap-1.5">
        <span className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Account
        </span>
        <AccountSelector
          accounts={accounts}
          value={accountId}
          onChange={onAccountChange}
        />
      </div>

      <nav className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Mailbox
          </span>
          <MailboxNavItem
            icon={InboxIcon}
            label="Inbox"
            count={inboxUnreadCount}
            active={view === "inbox"}
            onClick={() => onViewChange("inbox")}
          />
          <MailboxNavItem
            icon={SendIcon}
            label="Sent"
            active={view === "sent"}
            onClick={() => onViewChange("sent")}
          />
          <MailboxNavItem
            icon={Trash2Icon}
            label="Trash"
            active={view === "trash"}
            onClick={() => onViewChange("trash")}
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Filtered
          </span>
          <MailboxNavItem
            icon={StarIcon}
            label="Starred"
            active={view === "starred"}
            onClick={() => onViewChange("starred")}
          />
          <MailboxNavItem
            icon={ArchiveIcon}
            label="Archive"
            count={archivedCount}
            active={view === "archived"}
            onClick={() => onViewChange("archived")}
          />
        </div>
      </nav>
    </aside>
  );
};

interface MailboxNavItemProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

const MailboxNavItem = ({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: MailboxNavItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground",
      )}
    >
      <Icon className="size-4" />
      <span className="flex-1 text-left">{label}</span>
      {count ? (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
            active
              ? "bg-background text-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
};
