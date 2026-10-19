"use client";

import "client-only";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import type { IntegrationListItem } from "@/modules/integrations/lib";

import { INTEGRATION_PROVIDER_META } from "./provider-meta";
import { ProviderSetupChecklist } from "./provider-setup-guide";
import { CredentialStatusList, TestStatus } from "./integration-status";

interface IntegrationDetailsDialogProps {
  integration: IntegrationListItem;
  onOpenChange: (open: boolean) => void;
}

export const IntegrationDetailsDialog = ({
  integration,
  onOpenChange,
}: IntegrationDetailsDialogProps) => {
  const meta = INTEGRATION_PROVIDER_META[integration.provider];

  return (
    <ResponsiveDialog
      title={meta.name}
      description="Connection status and setup guide."
      open
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={integration.isEnabled ? "default" : "secondary"}>
              {integration.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <CredentialStatusList integration={integration} />

          <TestStatus integration={integration} />
          {!integration.lastTestedAt ? (
            <p className="text-sm text-muted-foreground">
              This connection has never been tested.
            </p>
          ) : null}
        </div>

        <Separator />

        <ProviderSetupChecklist provider={integration.provider} />
      </div>
    </ResponsiveDialog>
  );
};
