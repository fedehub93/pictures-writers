"use client";

import { useState } from "react";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";
import { Button } from "@/shared/ui/button";
import { PlugIcon } from "lucide-react";

import {
  useImportIntegrationFromEnv,
  useSetIntegrationEnabled,
  useSuspenseIntegrations,
  useTestIntegration,
  useUpdateIntegration,
} from "../hooks/use-integrations";
import { IntegrationCard, type IntegrationListItem } from "../components/integration-card";
import {
  IntegrationFormDialog,
  type IntegrationFormValues,
} from "../components/integration-form-dialog";

export const IntegrationsView = () => {
  const { data: integrations } = useSuspenseIntegrations();
  const updateMutation = useUpdateIntegration();
  const setEnabledMutation = useSetIntegrationEnabled();
  const importMutation = useImportIntegrationFromEnv();
  const testMutation = useTestIntegration();

  const [editingIntegration, setEditingIntegration] =
    useState<IntegrationListItem | null>(null);

  const handleEdit = (values: IntegrationFormValues) => {
    if (!editingIntegration) return;

    updateMutation.mutate(
      {
        provider: editingIntegration.provider,
        isEnabled: values.isEnabled,
        secrets: {
          apiKey: values.removeApiKey
            ? null
            : values.apiKey || undefined,
          webhookSecret: values.removeWebhookSecret
            ? null
            : values.webhookSecret || undefined,
        },
      },
      {
        onSuccess: () => setEditingIntegration(null),
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Manage third-party integrations and their credentials.
        </p>
      </div>

      {integrations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-md border p-8">
          <PlugIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No integrations available.
          </p>
          <Button variant="outline">Add integration</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.provider}
              integration={integration}
              onEdit={() => setEditingIntegration(integration)}
              onImport={() =>
                importMutation.mutate({ provider: integration.provider })
              }
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
              isImporting={importMutation.isPending}
            />
          ))}
        </div>
      )}

      {editingIntegration && (
        <IntegrationFormDialog
          provider={editingIntegration.provider}
          open={!!editingIntegration}
          onOpenChange={(open: boolean) => {
            if (!open) setEditingIntegration(null);
          }}
          defaultIsEnabled={editingIntegration.isEnabled}
          onSubmit={handleEdit}
          isPending={updateMutation.isPending}
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
  <ErrorState title="Error loading integrations" description="Something went wrong" />
);
