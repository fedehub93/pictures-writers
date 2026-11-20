"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HardDriveDownload, Square } from "lucide-react";

import { formatBytes } from "@/lib/format";
import { useTRPC } from "@/trpc/client";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { usePermission } from "@/shared/providers/authorization-provider";
import { Button } from "@/shared/ui/button";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import {
  useMediaRehomePlan,
  useMediaRehomeStatus,
} from "../../hooks/use-media";
import { mediaErrorMessage } from "../../lib/error-message";
import {
  REHOME_HEADROOM_RATIO,
  rehomeDiskShortageMessage,
  type PendingRehome,
} from "../../lib/rehome";
import {
  STORAGE_DRIVER_LABELS,
  type StorageDriverName,
} from "../../lib/storage-driver";

interface MediaRehomePanelProps {
  pending: PendingRehome;
  active: StorageDriverName;
}

/**
 * Moves the library's bytes to the active driver without touching a key, a
 * revision or a canonical address.
 *
 * The panel is the product's offer, never an automatic act: it says how many
 * files are still elsewhere, shows the space the copy needs before the owner
 * commits, follows the run's progress and can stop it at the next file
 * boundary. A file that cannot be read stays where it is, keeps serving, and
 * is reported by id.
 */
export const MediaRehomePanel = ({
  pending,
  active,
}: MediaRehomePanelProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const canUpdate = usePermission(PERMISSIONS.MEDIA_UPDATE);
  const { invalidateLibrary, invalidateRehome } = useMediaInvalidation();
  const statusQuery = useMediaRehomeStatus();
  const planQuery = useMediaRehomePlan(pending.files > 0);
  const start = useMutation(trpc.media.rehomeStart.mutationOptions());
  const stop = useMutation(trpc.media.rehomeStop.mutationOptions());

  const status = statusQuery.data;
  const isRunning = status?.status === "running" || status?.status === "stopping";
  const previousStatus = useRef<string | null>(null);

  // A finished run changes the library, the header count and the involved
  // drivers at once. Invalidate once on the transition; a poll returning the
  // same state must not keep refetching.
  useEffect(() => {
    if (!status) return;

    const wasRunning =
      previousStatus.current === "running" ||
      previousStatus.current === "stopping";
    previousStatus.current = status.status;

    if (!wasRunning || (status.status !== "done" && status.status !== "failed")) {
      return;
    }

    void invalidateLibrary();
    void invalidateRehome();

    if (status.status === "failed") {
      toast.error(status.error ?? "The move could not finish.");
      return;
    }

    if (status.stopped) {
      toast(
        `Move stopped: ${status.moved} files moved. Start it again to continue.`,
      );
      return;
    }

    if (status.superseded) {
      toast(
        "The storage driver changed, so the move stopped early. Start it again to converge on the new driver.",
      );
      return;
    }

    if (status.failed > 0) {
      toast(
        `${status.moved} files moved; ${status.failed} could not be moved and still serve from where they are.`,
      );
      return;
    }

    toast.success(
      `Moved ${status.moved} ${status.moved === 1 ? "file" : "files"} to ${STORAGE_DRIVER_LABELS[active].toLowerCase()}.`,
    );
  }, [status, active, invalidateLibrary, invalidateRehome]);

  if (isRunning && status) {
    const percent =
      status.total > 0
        ? Math.min(100, Math.round((status.processed / status.total) * 100))
        : 0;

    return (
      <div className="flex min-w-64 max-w-96 flex-col gap-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Moving files to {STORAGE_DRIVER_LABELS[active].toLowerCase()}
          </span>
          <span>
            {status.processed} of {status.total}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Files moved"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="h-full bg-emerald-500 transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {status.failed > 0
              ? `${status.failed} could not be moved so far.`
              : "Every file keeps serving while it moves."}
          </p>
          {status.status === "stopping" ? (
            <Button variant="outline" size="sm" disabled>
              Stopping…
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                stop.mutate(undefined, {
                  onSuccess: (state) => {
                    queryClient.setQueryData(
                      trpc.media.rehomeStatus.queryKey(),
                      state,
                    );
                  },
                  onError: (error) => toast.error(mediaErrorMessage(error)),
                })
              }
              disabled={stop.isPending}
            >
              <Square />
              Stop
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (pending.files === 0) return null;

  const plan = planQuery.data;
  const targetLabel = STORAGE_DRIVER_LABELS[active].toLowerCase();
  const filesLabel = `${pending.files} ${
    pending.files === 1 ? "file is" : "files are"
  }`;
  const tooLittleDisk =
    plan?.level === "refused" && plan.blockedReason === "disk";

  const description = !plan
    ? "Calculating the space this move needs…"
    : plan.blockedReason === "target-unconfigured"
      ? `${STORAGE_DRIVER_LABELS[active]} is not configured on this Installation, so files cannot be moved there.`
      : tooLittleDisk
        ? rehomeDiskShortageMessage(plan)
        : `Copies ${pending.files} ${
            pending.files === 1 ? "file" : "files"
          } (${formatBytes(
            plan.bytes,
          )}) to ${targetLabel}. Keys, revisions and canonical addresses stay the same, and every file keeps serving while it moves.${
            plan.unknownFiles > 0
              ? ` ${plan.unknownFiles} ${
                  plan.unknownFiles === 1 ? "file records" : "files record"
                } no size, so the estimate may be low.`
              : ""
          }${
            plan.level === "warning"
              ? ` The move reserves ${Math.round(
                  REHOME_HEADROOM_RATIO * 100,
                )}% headroom and would leave about ${formatBytes(
                  Math.max(
                    0,
                    (plan.availableBytes ?? 0) - plan.requiredBytes,
                  ),
                )} free.`
              : ""
          }`;

  const failures = status?.failures ?? [];

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-xs text-muted-foreground">
          {filesLabel} still on another driver ({formatBytes(pending.bytes)}).
          Moving them changes no address.
        </p>
        {canUpdate &&
          (plan?.level === "refused" ? (
            <Button variant="outline" size="sm" disabled>
              <HardDriveDownload />
              Move to {targetLabel}
            </Button>
          ) : (
            <ConfirmModal
              title={`Move every file to ${targetLabel}?`}
              description={description}
              confirmLabel="Move files"
              onConfirm={() => {
                start.mutate(
                  { confirmed: plan?.level === "warning" },
                  {
                    onSuccess: (state) => {
                      queryClient.setQueryData(
                        trpc.media.rehomeStatus.queryKey(),
                        state,
                      );
                    },
                    onError: (error) => {
                      toast.error(mediaErrorMessage(error));
                      // The plan may have changed between the preview and the
                      // start (disk filled, a driver unconfigured); ask again
                      // so the next click reads the current state.
                      void invalidateRehome();
                    },
                  },
                );
              }}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={planQuery.isLoading || start.isPending}
              >
                <HardDriveDownload />
                Move to {targetLabel}
              </Button>
            </ConfirmModal>
          ))}
        {plan?.blockedReason === "target-unconfigured" && (
          <p className="text-xs text-rose-600">
            {STORAGE_DRIVER_LABELS[active]} is not configured on this
            Installation.
          </p>
        )}
        {tooLittleDisk && (
          <p className="text-xs text-rose-600">
            {plan ? rehomeDiskShortageMessage(plan) : null}
          </p>
        )}
      </div>
      {failures.length > 0 && (
        <details className="text-xs text-muted-foreground">
          <summary>
            {failures.length}{" "}
            {failures.length === 1
              ? "file could not be moved"
              : "files could not be moved"}{" "}
            and still serves from its current driver
          </summary>
          <ul className="mt-1 flex flex-col gap-y-0.5 font-mono">
            {failures.map(({ fileId, reason }) => (
              <li key={`${fileId}-${reason}`}>
                {fileId} — {reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};
