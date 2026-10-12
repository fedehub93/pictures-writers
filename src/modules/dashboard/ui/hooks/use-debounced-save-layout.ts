"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import type { DashboardWidgetInstance } from "../../types";

/** How long to wait after the last change before persisting the layout. */
const SAVE_DEBOUNCE_MS = 600;

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Owns the dashboard's auto-save lifecycle. It holds the working copy of the
 * layout, applies each change optimistically, and persists the whole document
 * after a short debounce.
 *
 * Two correctness details:
 * - A pending change is **flushed on unmount**, so navigating away within the
 *   debounce window never drops the last edit.
 * - "Saved" is reported only when no newer change is queued (`pendingRef`) and
 *   no other save is in flight (`inFlightRef`), so an older save resolving does
 *   not claim the newest change was persisted.
 */
export const useDebouncedSaveLayout = (
  initialInstances: DashboardWidgetInstance[],
) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [instances, setInstances] =
    useState<DashboardWidgetInstance[]>(initialInstances);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<DashboardWidgetInstance[] | null>(null);
  const inFlightRef = useRef(0);
  const errorRef = useRef(false);

  const save = useMutation(trpc.dashboard.saveLayout.mutationOptions());
  const { mutate } = save;

  const fire = useCallback(
    (widgets: DashboardWidgetInstance[]) => {
      inFlightRef.current += 1;
      mutate(
        { widgets },
        {
          onSuccess: (result) => {
            queryClient.setQueryData(trpc.dashboard.getLayout.queryKey(), {
              widgets: result.widgets,
            });
          },
          onError: (error) => {
            errorRef.current = true;
            setSaveState("error");
            toast.error(error.message);
          },
          onSettled: () => {
            inFlightRef.current -= 1;
            if (
              inFlightRef.current === 0 &&
              pendingRef.current === null &&
              !errorRef.current
            ) {
              setSaveState("saved");
            }
          },
        },
      );
    },
    [mutate, queryClient, trpc],
  );

  useEffect(
    () => () => {
      if (!timerRef.current) return;
      clearTimeout(timerRef.current);
      const pending = pendingRef.current;
      if (pending) {
        pendingRef.current = null;
        fire(pending);
      }
    },
    [fire],
  );

  /** Applies a change locally and schedules its persistence. */
  const commit = useCallback(
    (next: DashboardWidgetInstance[]) => {
      setInstances(next);
      setSaveState("saving");
      errorRef.current = false;
      pendingRef.current = next;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const widgets = pendingRef.current;
        if (!widgets) return;
        pendingRef.current = null;
        fire(widgets);
      }, SAVE_DEBOUNCE_MS);
    },
    [fire],
  );

  return { instances, commit, saveState };
};
