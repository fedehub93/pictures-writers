"use client";

import "client-only";

import {
  ImportIcon,
  InfoIcon,
  MoreHorizontalIcon,
  PlayIcon,
  Settings2Icon,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Switch } from "@/shared/ui/switch";
import type { IntegrationListItem } from "@/modules/integrations/lib";

import { INTEGRATION_PROVIDER_META } from "./provider-meta";
import { CredentialStatusList, TestStatus } from "./integration-status";

interface IntegrationCardProps {
  integration: IntegrationListItem;
  canManage: boolean;
  onEdit: () => void;
  onDetails: () => void;
  onImport: () => void;
  onTest: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  isToggling?: boolean;
  isTesting?: boolean;
  isImporting?: boolean;
}

export const IntegrationCard = ({
  integration,
  canManage,
  onEdit,
  onDetails,
  onImport,
  onTest,
  onToggleEnabled,
  isToggling,
  isTesting,
  isImporting,
}: IntegrationCardProps) => {
  const { Icon, ...meta } = INTEGRATION_PROVIDER_META[integration.provider];
  const isBusy = isToggling || isTesting || isImporting;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex size-12 items-center justify-center rounded-lg border bg-muted/40 text-foreground">
          <Icon className="size-7" />
        </div>
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label={`${meta.name} actions`}
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={isBusy} onSelect={onImport}>
                <ImportIcon />
                Import from environment
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isBusy || !integration.isEnabled}
                onSelect={onTest}
              >
                <PlayIcon />
                Test connection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{meta.name}</CardTitle>
            <Badge
              variant={integration.isEnabled ? "default" : "secondary"}
            >
              {integration.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <CardDescription>{meta.description}</CardDescription>
        </div>

        <div className="flex flex-col gap-2">
          <CredentialStatusList integration={integration} />
          <TestStatus integration={integration} />
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex items-center justify-between gap-2 border-t pt-6">
        <div className="flex items-center gap-2">
          {canManage ? (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onEdit}
              disabled={isBusy}
              aria-label="Edit credentials"
            >
              <Settings2Icon />
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={onDetails}>
            <InfoIcon data-icon="inline-start" />
            Details
          </Button>
        </div>
        {canManage ? (
          <Switch
            checked={integration.isEnabled}
            onCheckedChange={onToggleEnabled}
            disabled={isBusy || !integration.hasApiKey}
            aria-label={`Toggle ${meta.name} integration`}
          />
        ) : null}
      </CardFooter>
    </Card>
  );
};
