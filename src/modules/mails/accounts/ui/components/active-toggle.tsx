"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";

import { Switch } from "@/shared/ui/switch";

import { EmailAccountGetManyRow } from "../../types";

interface EmailAccountActiveToggleProps {
  account: EmailAccountGetManyRow;
}

export const EmailAccountActiveToggle = ({
  account,
}: EmailAccountActiveToggleProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const setActive = useMutation(
    trpc.emailAccounts.setActive.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.emailAccounts.getMany.queryOptions(),
        );
        toast.success(
          account.isActive ? "Account deactivated" : "Account activated",
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  return (
    <Switch
      checked={account.isActive}
      disabled={setActive.isPending}
      onCheckedChange={(checked) =>
        setActive.mutate({ id: account.id, isActive: checked })
      }
      aria-label={account.isActive ? "Deactivate account" : "Activate account"}
    />
  );
};
