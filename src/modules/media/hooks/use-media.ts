import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { inferInput } from "@trpc/tanstack-react-query";

import { useTRPC } from "@/trpc/client";
import { trpc } from "@/trpc/server";

import { DEFAULT_PAGE } from "../constants";

type MediaListInput = inferInput<typeof trpc.media.getMany>;
type MediaMetaInput = inferInput<typeof trpc.media.getMeta>;

/** Suspense read of the visible page of the media library. */
export const useSuspenseMedia = (params: MediaListInput) => {
  const trpc = useTRPC();

  return useSuspenseQuery(trpc.media.getMany.queryOptions({ ...params }));
};

/**
 * How many recent Media the preview opens with, and how many one "View more"
 * activation adds. The box reads eight in one request, so the second row needs
 * no round-trip.
 */
export const RECENT_PREVIEW_COUNT = 4;

/**
 * The single read's page size, and the box's hard cap: two preview rows, so a
 * second activation can always complete the row without another request.
 */
export const RECENT_BOX_SIZE = RECENT_PREVIEW_COUNT * 2;

/** The input the server prefetches for the Recent box preview. */
export const recentMediaInput = {
  view: "recent" as const,
  search: "",
  page: DEFAULT_PAGE,
  pageSize: RECENT_BOX_SIZE,
};

/** Non-suspense read of the newest active Media for the Recent box. */
export const useMediaRecent = () => {
  const trpc = useTRPC();

  return useQuery(trpc.media.getMany.queryOptions(recentMediaInput));
};

/**
 * The nested folder tree. It is non suspense so the sidebar renders beside a
 * grid that is still resolving, without a second loading gate.
 */
export const useMediaFolderTree = () => {
  const trpc = useTRPC();

  return useQuery(trpc.media.getFolderTree.queryOptions());
};

/**
 * The header read: filtered count, quota, storage choice and how many files
 * still sit on another driver. It is non suspense so the header can render
 * while the grid streams.
 */
export const useMediaMeta = (params: MediaMetaInput) => {
  const trpc = useTRPC();

  return useQuery(trpc.media.getMeta.queryOptions({ ...params }));
};

/**
 * The facts the details panel shows for the folder the editor has open. It is
 * enabled only inside My Drive, where a folder is the current scope; the flat
 * Recent and Archived views select nothing but a Media.
 */
export const useMediaFolderDetails = (folderId: string | null) => {
  const trpc = useTRPC();

  return useQuery(
    trpc.media.getFolderDetails.queryOptions(
      { id: folderId ?? "" },
      { enabled: folderId !== null },
    ),
  );
};

/**
 * The space the next move needs. It is only asked when the header says a
 * move is possible; the server refuses an impossible run with the same plan.
 */
export const useMediaRehomePlan = (enabled: boolean) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.media.rehomePlan.queryOptions(),
    enabled,
  });
};

/** The current or last move. Polling follows the run, not a fixed clock. */
export const useMediaRehomeStatus = () => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.media.rehomeStatus.queryOptions(),
    refetchInterval: (query) =>
      query.state.data?.status === "running" ||
      query.state.data?.status === "stopping"
        ? 1000
        : false,
  });
};
