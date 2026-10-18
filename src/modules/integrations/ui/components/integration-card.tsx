"use client";

import {
  CheckCircleIcon,
  EditIcon,
  ImportIcon,
  PlayIcon,
  PlugIcon,
  XCircleIcon,
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
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

export interface IntegrationListItem {
  provider: string;
  isEnabled: boolean;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  lastTestedAt: Date | null;
  lastTestStatus: string | null;
}

interface IntegrationCardProps {
  integration: IntegrationListItem;
  onEdit: () => void;
  onImport: () => void;
  onTest: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  isToggling?: boolean;
  isTesting?: boolean;
  isImporting?: boolean;
}

export const IntegrationCard = ({
  integration,
  onEdit,
  onImport,
  onTest,
  onToggleEnabled,
  isToggling,
  isTesting,
  isImporting,
}: IntegrationCardProps) => {
  const isConfigured = integration.hasApiKey;
  const hasPassedTest = integration.lastTestStatus === "SUCCESS";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <PlugIcon className="size-5 text-muted-foreground" />
            <CardTitle className="capitalize">{integration.provider}</CardTitle>
          </div>
          <CardDescription>
            {isConfigured
              ? "Credentials are stored in the database."
              : "No credentials configured yet."}
          </CardDescription>
        </div>
        <Badge
          variant={integration.isEnabled ? "default" : "secondary"}
          className="capitalize"
        >
          {integration.isEnabled ? "Enabled" : "Disabled"}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                integration.hasApiKey ? "bg-green-500" : "bg-muted-foreground",
              )}
            />
            <span className="text-muted-foreground">API key</span>
            <span>{integration.hasApiKey ? "Present" : "Missing"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                integration.hasWebhookSecret
                  ? "bg-green-500"
                  : "bg-muted-foreground",
              )}
            />
            <span className="text-muted-foreground">Webhook secret</span>
            <span>{integration.hasWebhookSecret ? "Present" : "Missing"}</span>
          </div>
        </div>
        {integration.lastTestedAt && (
          <div className="flex items-center gap-2 text-sm">
            {hasPassedTest ? (
              <CheckCircleIcon className="size-4 text-green-500" />
            ) : (
              <XCircleIcon className="size-4 text-destructive" />
            )}
            <span className="text-muted-foreground">Last test</span>
            <span className="capitalize">
              {integration.lastTestStatus?.toLowerCase()}
            </span>
            <span className="text-muted-foreground">
              {integration.lastTestedAt.toLocaleString()}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isToggling || isTesting || isImporting}
        >
          <EditIcon data-icon="inline-start" />
          Edit credentials
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onImport}
          disabled={isToggling || isTesting || isImporting}
        >
          <ImportIcon data-icon="inline-start" />
          {isImporting ? "Importing..." : "Import from env"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={isToggling || isTesting || isImporting || !integration.isEnabled}
        >
          <PlayIcon data-icon="inline-start" />
          {isTesting ? "Testing..." : "Test connection"}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Switch
            checked={integration.isEnabled}
            onCheckedChange={onToggleEnabled}
            disabled={isToggling || isTesting || isImporting}
            aria-label={`Toggle ${integration.provider} integration`}
          />
        </div>
      </CardFooter>
    </Card>
  );
};
