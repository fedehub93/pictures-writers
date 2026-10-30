"use client";

import "client-only";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";

import {
  buildMessageDocument,
  resolveMessageDocumentEvent,
} from "@/modules/mails/lib/message-document";

interface MessageBodyProps {
  /** Stored, untrusted email HTML. */
  html: string;
  /** Accessible name for the frame; should identify the sender. */
  title: string;
}

/**
 * Render a stored email body in a sandboxed iframe. The document is rebuilt
 * when remote images are revealed and its height follows the message contents,
 * so the thread stays the only scroll container.
 */
export const MessageBody = ({ html, title }: MessageBodyProps) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [showImages, setShowImages] = useState(false);
  const [height, setHeight] = useState<number | null>(null);

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
        setHeight(message.height);
        return;
      }

      window.open(message.href, "_blank", "noopener,noreferrer");
    };

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [messageDocument.html]);

  return (
    <div>
      {messageDocument.hasRemoteContent && (
        <div className="mb-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-pressed={showImages}
            onClick={() => setShowImages((current) => !current)}
          >
            Show images
          </Button>
        </div>
      )}

      <iframe
        ref={frameRef}
        title={title}
        sandbox="allow-scripts"
        srcDoc={messageDocument.html}
        scrolling="no"
        referrerPolicy="no-referrer"
        className="block w-full border-0 bg-white"
        style={{ height: height ?? 0 }}
      />
    </div>
  );
};
