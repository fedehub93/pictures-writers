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
  ComposerAttachments,
  type ComposerAttachment,
} from "./composer-attachments";
import { createComposerExtensions } from "./composer-extensions";
import { ComposerToolbar } from "./composer-toolbar";

interface ReplyComposerProps {
  conversation: ConversationGetOne;
  account?: EmailAccountAllowed;
}

export const ReplyComposer = ({ conversation, account }: ReplyComposerProps) => {
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

  const sendReply = useSendReply(conversation.emailAccountId);

  const editor = useEditor({
    extensions: createComposerExtensions(),
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-40 px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  const reset = () => {
    editor?.commands.setContent(initialHtml);
    setSubject(replySubject(lastSubject));
    setAttachments([]);
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
        bodyText,
        attachments,
      },
      {
        onSuccess: () => {
          toast.success("Reply sent");
          reset();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <div className="border-t bg-background">
      <div className="flex flex-col gap-2 p-3 md:p-4">
        <div className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
            To
          </span>
          <Input readOnly value={conversation.contactEmail} className="h-9" />
        </div>

        {account && (
          <div className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
              From
            </span>
            <span className="truncate text-sm text-muted-foreground">
              {account.email}
            </span>
          </div>
        )}

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
          disabled={sendReply.isPending}
        />

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={reset}
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
