"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { SendHorizontalIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { type EmailAccountAllowed } from "@/modules/mails/accounts/types";

import { useSendNewMessage } from "../../../hooks/use-send-new-message";
import { signatureToHtml } from "../../../lib/format";
import {
  ComposerAttachmentButtons,
  ComposerAttachmentList,
  type ComposerAttachment,
} from "./composer-attachments";
import { createComposerExtensions } from "./composer-extensions";
import { ComposerToolbar } from "./composer-toolbar";

interface NewMessagePanelProps {
  accounts: EmailAccountAllowed[];
  defaultAccountId?: string;
  /** Closed without sending (Discard, the close button or the header action). */
  onDiscard: () => void;
  /** Called with the account id and created conversation so the inbox can open it. */
  onSent: (emailAccountId: string, conversationId: string) => void;
}

export const NewMessagePanel = ({
  accounts,
  defaultAccountId,
  onDiscard,
  onSent,
}: NewMessagePanelProps) => {
  const [accountId, setAccountId] = useState(
    () => defaultAccountId ?? accounts[0]?.id ?? "",
  );
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);

  const account = accounts.find((item) => item.id === accountId);
  const sendNew = useSendNewMessage(accountId);

  const editor = useEditor({
    extensions: createComposerExtensions("Write your message…"),
    content: signatureToHtml(account?.signature),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-64 px-4 py-3 text-sm focus:outline-none",
      },
    },
  });

  // Keep the pre-filled signature in sync with the selected account.
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(signatureToHtml(account?.signature));
  }, [editor, account?.signature]);

  const handleAddAttachments = (files: ComposerAttachment[]) => {
    setAttachments((current) => [...current, ...files]);
  };

  const handleSend = () => {
    if (!editor) return;

    if (!accountId) {
      toast.error("Select an account to send from");
      return;
    }
    if (!to.trim()) {
      toast.error("Enter a recipient");
      return;
    }
    if (!subject.trim()) {
      toast.error("Enter a subject");
      return;
    }

    const bodyText = editor.getText().trim();
    if (!bodyText) {
      toast.error("Write a message before sending");
      return;
    }

    sendNew.mutate(
      {
        emailAccountId: accountId,
        to: to.trim(),
        subject: subject.trim(),
        bodyHtml: editor.getHTML(),
        bodyText,
        attachments,
      },
      {
        onSuccess: (data) => {
          toast.success("Message sent");
          onSent(accountId, data.conversationId);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">New message</h2>
          <p className="truncate text-xs text-muted-foreground">
            Send a one-to-one email to any address.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDiscard}
          disabled={sendNew.isPending}
          aria-label="Close composer"
        >
          <XIcon />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col border-b">
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
              From
            </span>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger
                className="h-8 w-full border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                aria-label="Send from account"
              >
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {item.email}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 border-t px-4 py-2">
            <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
              To
            </span>
            <Input
              type="email"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="recipient@example.com"
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label="To"
            />
          </div>

          <div className="flex items-center gap-2 border-t px-4 py-2">
            <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
              Subject
            </span>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject"
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label="Subject"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <ComposerToolbar editor={editor} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
        </div>

        <ComposerAttachmentList
          value={attachments}
          onChange={setAttachments}
          disabled={sendNew.isPending}
          className="border-t px-4 py-3"
        />

        <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
          <ComposerAttachmentButtons
            onAdd={handleAddAttachments}
            disabled={sendNew.isPending}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onDiscard}
              disabled={sendNew.isPending}
            >
              Discard
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={sendNew.isPending || !editor}
            >
              {sendNew.isPending ? "Sending…" : "Send"}
              <SendHorizontalIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
