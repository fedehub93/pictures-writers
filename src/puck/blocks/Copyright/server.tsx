import "server-only";

import { getSettings } from "@/data/settings";

import type { CopyrightBlockProps } from "./types";
import { CopyrightBlockUi } from "./ui/copyright";

/**
 * Server renderer for the Copyright block.
 *
 * The site name lives in Settings, which is only readable on the server. The
 * editor config in `./index.tsx` stays database-free so it can be imported by
 * the client-side region editor.
 */
export const CopyrightServer = async ({
  showYear,
  extraText,
  links,
}: CopyrightBlockProps) => {
  const settings = await getSettings();

  return (
    <CopyrightBlockUi
      siteName={settings.siteName ?? undefined}
      showYear={showYear}
      extraText={extraText}
      links={links}
    />
  );
};
