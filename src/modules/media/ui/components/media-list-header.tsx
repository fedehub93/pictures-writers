"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { useMediaMeta } from "../../hooks/use-media";
import { useMediaFilters } from "../../hooks/use-media-filters";
import { openMediaFolderId } from "../../lib/media-folder";

import { MediaCreateAction } from "./media-create-action";
import { MediaQuotaMeter } from "./media-quota-meter";
import { MediaRehomePanel } from "./media-rehome-panel";
import { MediaSearchFilter } from "./media-search-filter";
import { MediaStorageDriverSelect } from "./media-storage-driver-select";

/**
 * The header owns the filtered count, the search, the quota, the storage
 * driver choice, the offer to move files still elsewhere and the upload
 * action. The sidebar owns navigation between My Drive, Recent and Archived.
 * The header renders outside the grid's suspense boundary, so the list
 * resolving never hides the controls.
 */
export const MediaListHeader = () => {
  const [filters] = useMediaFilters();

  const { data } = useMediaMeta({
    search: filters.search,
    view: filters.view,
    folderId: filters.folderId,
  });

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader label="Media" totalEntries={data?.total ?? 0} />
      <div className="flex flex-wrap items-center gap-4">
        <MediaSearchFilter />
        <div className="ml-auto flex flex-wrap items-center gap-4">
          {data && <MediaQuotaMeter quota={data.quota} />}
          {data && (
            <MediaStorageDriverSelect
              active={data.storage.active}
              uploadThingAvailable={data.storage.uploadThingAvailable}
            />
          )}
          {/* Archived holds files that left the library; uploading there could
              only create an active Media the view would not show. */}
          {filters.view !== "archived" && (
            <MediaCreateAction
              folderId={openMediaFolderId({
                view: filters.view,
                folderId: filters.folderId,
              })}
            />
          )}
        </div>
      </div>
      {data && (
        <MediaRehomePanel pending={data.rehome} active={data.storage.active} />
      )}
    </div>
  );
};
