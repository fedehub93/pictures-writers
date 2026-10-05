"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

import { MAX_CANCEL_REASON_LENGTH } from "../../../constants";

interface CancelRunDialogProps {
  automationId: string;
  runId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CancelRunDialog = ({
  automationId,
  runId,
  open,
  onOpenChange,
}: CancelRunDialogProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const cancelRun = useMutation(
    trpc.automations.cancelRun.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.automations.getRun.queryFilter({ automationId, id: runId }),
        );
        queryClient.invalidateQueries(
          trpc.automations.getRuns.queryFilter({ automationId }),
        );
        toast.success("Run canceled");
        setReason("");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setReason("");
    }
    onOpenChange(next);
  };

  const onConfirm = () => {
    const trimmed = reason.trim();
    cancelRun.mutate({
      automationId,
      id: runId,
      reason: trimmed ? trimmed : undefined,
    });
  };

  return (
    <ResponsiveDialog
      title="Cancel run"
      description="Cancel this Run and skip its remaining Steps. A Step already in flight may still finish, but nothing runs after it. This cannot be undone."
      open={open}
      onOpenChange={handleOpenChange}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cancel-run-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-run-reason"
            value={reason}
            maxLength={MAX_CANCEL_REASON_LENGTH}
            rows={3}
            placeholder="Why is this Run being canceled?"
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={cancelRun.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Keep run
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={cancelRun.isPending}
            onClick={onConfirm}
          >
            Cancel run
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
};
