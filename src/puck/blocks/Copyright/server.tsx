import "server-only";

import { getSettings } from "@/data/settings";

import type { CopyrightBlockProps } from "./types";
import { renderCopyrightBlock } from "./render";

/**
 * Server renderer for the Copyright block.
 *
 * The site name lives in Settings, which is only readable on the server. The
 * editor config in `./index.tsx` stays database-free so it can be imported by
 * the client-side region editor; both sides share the same render function in
 * `./render.tsx`.
 */
export const CopyrightServer = async ({
  content,
  layout,
  dimension,
  typography,
}: CopyrightBlockProps) => {
  const settings = await getSettings();

  return renderCopyrightBlock({
    content,
    layout,
    dimension,
    typography,
    siteName: settings.siteName ?? undefined,
  });
};
