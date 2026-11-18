"use client";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { useMediaMeta } from "../../hooks/use-media";
import { useMediaFilters } from "../../hooks/use-media-filters";

import { MediaCreateAction } from "./media-create-action";
import { MediaQuotaMeter } from "./media-quota-meter";
import { MediaSearchFilter } from "./media-search-filter";
import { MediaStorageDriverSelect } from "./media-storage-driver-select";
import { MediaViewSwitch } from "./media-view-switch";

/**
 * The header owns the filtered count, the search, the view switch, the quota,
 * the storage driver choice and the upload action. It renders outside the
 * grid's suspense boundary, so the list resolving never hides the controls.
 */
export const MediaListHeader = () => {
  const [filters] = useMediaFilters();

  const { data } = useMediaMeta({
    search: filters.search,
    view: filters.view,
  });

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader label="Media" totalEntries={data?.total ?? 0} />
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-x-2">
          <MediaSearchFilter />
          <MediaViewSwitch />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-4">
          {data && <MediaQuotaMeter quota={data.quota} />}
          {data && (
            <MediaStorageDriverSelect
              active={data.storage.active}
              uploadThingAvailable={data.storage.uploadThingAvailable}
            />
          )}
          {filters.view === "active" && <MediaCreateAction />}
        </div>
      </div>
    </div>
  );
};
