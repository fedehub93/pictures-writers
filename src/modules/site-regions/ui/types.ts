import type { Data } from "@puckeditor/core";

import type { ContentStatus, SiteRegionKey } from "@/generated/prisma";

export interface SiteRegionEditorVersion {
  id: string;
  version: number;
  status: ContentStatus;
}

export interface SiteRegionEditorState {
  key: SiteRegionKey;
  rootId: string;
  version: SiteRegionEditorVersion;
}

export interface SiteRegionEditorData {
  key: SiteRegionKey;
  rootId: string;
  version: SiteRegionEditorVersion & {
    puckData: Data | null;
  };
}
