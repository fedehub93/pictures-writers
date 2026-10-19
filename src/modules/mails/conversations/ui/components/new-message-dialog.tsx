"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { PenSquareIcon, SendHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { type EmailAccountAllowed } from "@/modules/mails/accounts/types";

import { useSendNewMessage } from "../../hooks/use-send-new-message";
import { signatureToHtml } from "../../lib/format";
import {
  ComposerAttachments,
  type ComposerAttachment,
} from "./composer/composer-attachments";
import { createComposerExtensions } from "./composer/composer-extensions";
import { ComposerToolbar } from "./composer/composer-toolbar";

interface NewMessageDialogProps {
  accounts: EmailAccountAllowed[];
  defaultAccountId?: string;
  /** Called with the account id and created conversation so the inbox can open it. */
  onSent?: (emailAccountId: string, conversationId: string) => void;
}

export const NewMessageDialog = ({
  accounts,
  defaultAccountId,
  onSent,
}: NewMessageDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          <PenSquareIcon className="size-4" />
          New message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Send a one-to-one email to any address.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <NewMessageForm
            accounts={accounts}
            defaultAccountId={defaultAccountId}
            onSent={(emailAccountId, conversationId) => {
              setOpen(false);
              onSent?.(emailAccountId, conversationId);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

interface NewMessageFormProps {
  accounts: EmailAccountAllowed[];
  defaultAccountId?: string;
  onSent: (emailAccountId: string, conversationId: string) => void;
}

const NewMessageForm = ({
  accounts,
  defaultAccountId,
  onSent,
}: NewMessageFormProps) => {
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
          "prose prose-sm max-w-none min-h-40 px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  // Keep the pre-filled signature in sync with the selected account.
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(signatureToHtml(account?.signature));
  }, [editor, account?.signature]);

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
          From
        </span>
        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="h-9 w-full" aria-label="Send from account">
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

      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
          To
        </span>
        <Input
          type="email"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="recipient@example.com"
          className="h-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
          Subject
        </span>
        <Input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="h-9"
        />
      </div>

      <div className="overflow-hidden rounded-md border">
        <ComposerToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      <ComposerAttachments
        value={attachments}
        onChange={setAttachments}
        disabled={sendNew.isPending}
      />

      <div className="flex items-center justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="ghost" disabled={sendNew.isPending}>
            Cancel
          </Button>
        </DialogClose>
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
  );
};
