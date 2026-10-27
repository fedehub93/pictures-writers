"use client";

import "client-only";

import { useState } from "react";
import { PlugIcon } from "lucide-react";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/shared/ui/empty";
import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { PERMISSIONS } from "@/shared/lib/permissions";
import { usePermission } from "@/shared/providers/authorization-provider";

import {
  useSetIntegrationEnabled,
  useSuspenseIntegrations,
  useTestIntegration,
  useUpdateIntegration,
} from "../hooks/use-integrations";
import { IntegrationCard } from "../components/integration-card";
import { IntegrationDetailsDialog } from "../components/integration-details-dialog";
import type { IntegrationListItem } from "@/modules/integrations/lib";
import {
  getIntegrationDescriptor,
  type IntegrationProviderFormValues,
} from "@/modules/integrations/lib/providers";

export const IntegrationsView = () => {
  const { data: integrations } = useSuspenseIntegrations();
  const canManage = usePermission(PERMISSIONS.INTEGRATIONS_MANAGE);
  const updateMutation = useUpdateIntegration();
  const setEnabledMutation = useSetIntegrationEnabled();
  const testMutation = useTestIntegration();

  const [editingIntegration, setEditingIntegration] =
    useState<IntegrationListItem | null>(null);
  const [detailsIntegration, setDetailsIntegration] =
    useState<IntegrationListItem | null>(null);

  const editingDescriptor = editingIntegration
    ? getIntegrationDescriptor(editingIntegration.provider)
    : null;
  const EditingForm = editingDescriptor?.adminForm;

  const handleEdit = (values: IntegrationProviderFormValues) => {
    if (!editingIntegration) return;

    updateMutation.mutate(
      {
        provider: editingIntegration.provider,
        config: values.config,
        secrets: values.secrets,
      },
      {
        onSuccess: () => setEditingIntegration(null),
      },
    );
  };

  return (
    <div className="flex h-full w-full flex-col gap-y-4 px-6 py-3">
      <ContentHeader
        label="Integrations"
        totalEntries={integrations.length}
      />

      {integrations.length === 0 ? (
        <Empty className="border">
          <EmptyMedia variant="icon">
            <PlugIcon />
          </EmptyMedia>
          <EmptyTitle>No integrations available</EmptyTitle>
          <EmptyDescription>
            Integration providers will appear here once they are available.
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.provider}
              integration={integration}
              canManage={canManage}
              onEdit={() => setEditingIntegration(integration)}
              onDetails={() => setDetailsIntegration(integration)}
              onTest={() =>
                testMutation.mutate({ provider: integration.provider })
              }
              onToggleEnabled={(enabled: boolean) =>
                setEnabledMutation.mutate({
                  provider: integration.provider,
                  isEnabled: enabled,
                })
              }
              isToggling={setEnabledMutation.isPending}
              isTesting={testMutation.isPending}
            />
          ))}
        </div>
      )}

      {editingIntegration && EditingForm && editingDescriptor ? (
        <EditingForm
          open
          onOpenChange={(open: boolean) => {
            if (!open) setEditingIntegration(null);
          }}
          providerName={editingDescriptor.presentation.name}
          config={editingIntegration.config}
          secrets={editingIntegration.secrets}
          onSubmit={handleEdit}
          isPending={updateMutation.isPending}
        />
      ) : null}

      {detailsIntegration && (
        <IntegrationDetailsDialog
          integration={detailsIntegration}
          onOpenChange={(open: boolean) => {
            if (!open) setDetailsIntegration(null);
          }}
        />
      )}
    </div>
  );
};

export const IntegrationsViewLoading = () => (
  <LoadingState
    title="Loading integrations"
    description="This may take a few seconds"
  />
);

export const IntegrationsViewError = () => (
  <ErrorState
    title="Error loading integrations"
    description="Something went wrong"
  />
);
