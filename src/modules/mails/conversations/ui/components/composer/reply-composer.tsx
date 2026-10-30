"use client";

import { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { SendHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { type EmailAccountAllowed } from "@/modules/mails/accounts/types";

import { useSendReply } from "../../../hooks/use-send-reply";
import { replySubject, signatureToHtml } from "../../../lib/format";
import { type ConversationGetOne } from "../../../types";
import {
  ComposerAttachmentButtons,
  ComposerAttachmentList,
  type ComposerAttachment,
} from "./composer-attachments";
import { createComposerExtensions } from "./composer-extensions";
import { ComposerToolbar } from "./composer-toolbar";

interface ReplyComposerProps {
  conversation: ConversationGetOne;
  account?: EmailAccountAllowed;
  /** Called after a reply was sent successfully. */
  onSent?: () => void;
  /** Called when the user dismisses the composer. */
  onDiscard?: () => void;
}

export const ReplyComposer = ({
  conversation,
  account,
  onSent,
  onDiscard,
}: ReplyComposerProps) => {
  const lastSubject = useMemo(() => {
    const withSubject = [...conversation.messages]
      .reverse()
      .find((message) => message.subject);
    return withSubject?.subject ?? null;
  }, [conversation.messages]);

  const initialHtml = useMemo(
    () => signatureToHtml(account?.signature),
    [account?.signature],
  );

  const [subject, setSubject] = useState(() => replySubject(lastSubject));
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);

  const sendReply = useSendReply();

  const editor = useEditor({
    extensions: createComposerExtensions(),
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-40 px-4 py-3 text-sm focus:outline-none",
      },
    },
  });

  const reset = () => {
    editor?.commands.setContent(initialHtml);
    setSubject(replySubject(lastSubject));
    setAttachments([]);
  };

  const handleAddAttachments = (files: ComposerAttachment[]) => {
    setAttachments((current) => [...current, ...files]);
  };

  const handleSend = () => {
    if (!editor) return;

    const bodyText = editor.getText().trim();
    if (!bodyText) {
      toast.error("Write a message before sending");
      return;
    }

    sendReply.mutate(
      {
        conversationId: conversation.id,
        subject,
        bodyHtml: editor.getHTML(),
        attachments,
      },
      {
        onSuccess: () => {
          toast.success("Reply sent");
          reset();
          onSent?.();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="border-t bg-background">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
          From
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {account?.email ?? "your account"}
        </span>
      </div>

      <div className="flex items-center gap-2 border-t px-4 py-2">
        <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">
          To
        </span>
        <Input
          readOnly
          value={conversation.contactEmail}
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
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          aria-label="Subject"
        />
      </div>

      <div className="border-t">
        <ComposerToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>

      <ComposerAttachmentList
        value={attachments}
        onChange={setAttachments}
        disabled={sendReply.isPending}
        className="border-t px-4 py-3"
      />

      <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
        <ComposerAttachmentButtons
          onAdd={handleAddAttachments}
          disabled={sendReply.isPending}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              reset();
              onDiscard?.();
            }}
            disabled={sendReply.isPending}
          >
            Discard
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sendReply.isPending || !editor}
          >
            {sendReply.isPending ? "Sending…" : "Send"}
            <SendHorizontalIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
