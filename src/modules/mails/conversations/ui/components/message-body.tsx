"use client";

import "client-only";

import { ImageOffIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import {
  buildMessageDocument,
  resolveMessageDocumentEvent,
} from "@/modules/mails/lib/message-document";

import {
  cacheMessageHeight,
  getCachedMessageHeight,
  messageHeightKey,
} from "../../lib/message-height-cache";

interface MessageBodyProps {
  /** Stored, untrusted email HTML. */
  html: string;
  /** Accessible name for the frame; should identify the sender. */
  title: string;
  /** Identifies the message so a measured height can be reused. */
  messageId: string;
}

/** Height of the frame until the document reports its first measurement. */
const UNMEASURED_HEIGHT = 64;

/**
 * Render a stored email body in a sandboxed iframe, presented as an inset sheet
 * that matches the message header. The document is rebuilt when remote images
 * are revealed and its height follows the message contents, so the thread stays
 * the only scroll container.
 */
export const MessageBody = ({ html, title, messageId }: MessageBodyProps) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [showImages, setShowImages] = useState(false);
  const [height, setHeight] = useState<number | null>(() =>
    getCachedMessageHeight(messageHeightKey(messageId, false)),
  );

  const heightKey = messageHeightKey(messageId, showImages);

  const messageDocument = useMemo(
    () => buildMessageDocument(html, { allowRemoteImages: showImages }),
    [html, showImages],
  );

  useEffect(() => {
    const frameWindow = frameRef.current?.contentWindow;
    if (!frameWindow) return;

    // The frame has no same-origin access, so `event.origin` is "null". Trust
    // the window reference instead and validate the payload shape.
    const onMessage = (event: MessageEvent) => {
      const message = resolveMessageDocumentEvent(
        event.source,
        frameWindow,
        event.data,
      );

      if (!message) return;

      if (message.type === "height") {
        cacheMessageHeight(heightKey, message.height);
        setHeight(message.height);
        return;
      }

      window.open(message.href, "_blank", "noopener,noreferrer");
    };

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [messageDocument.html, heightKey]);

  // A message has a different height with its images revealed, so the toggle
  // starts from that state's measurement. Until the new measurement arrives the
  // current height is kept as the placeholder, so revealing images never
  // collapses the sheet to the unmeasured height first.
  const toggleImages = () => {
    const next = !showImages;

    setShowImages(next);
    setHeight(
      (current) =>
        getCachedMessageHeight(messageHeightKey(messageId, next)) ?? current,
    );
  };

  return (
    <div>
      {messageDocument.hasRemoteContent && (
        <div className="mb-2 flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
          <ImageOffIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            {showImages
              ? "Remote images are shown for this message."
              : "Remote images are blocked for this message."}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs font-medium"
            aria-pressed={showImages}
            onClick={toggleImages}
          >
            {showImages ? "Hide images" : "Show images"}
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-white dark:ring-1 dark:ring-white/10">
        <iframe
          ref={frameRef}
          title={title}
          sandbox="allow-scripts"
          srcDoc={messageDocument.html}
          scrolling="no"
          referrerPolicy="no-referrer"
          className="block w-full border-0 bg-white"
          style={{ height: height ?? UNMEASURED_HEIGHT }}
        />
      </div>
    </div>
  );
};
