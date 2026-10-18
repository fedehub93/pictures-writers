import "client-only";

import { CheckCircleIcon, XCircleIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import type { IntegrationListItem } from "@/modules/integrations/lib";

const PresenceDot = ({ present }: { present: boolean }) => (
  <span
    className={cn(
      "size-2 rounded-full",
      present ? "bg-green-500" : "bg-muted-foreground",
    )}
  />
);

const CredentialRow = ({
  label,
  present,
}: {
  label: string;
  present: boolean;
}) => (
  <div className="flex items-center gap-2">
    <PresenceDot present={present} />
    <span className="text-muted-foreground">{label}</span>
    <span>{present ? "Present" : "Missing"}</span>
  </div>
);

/** Write-only credential presence for the providers that expose ones. */
export const CredentialStatusList = ({
  integration,
}: {
  integration: IntegrationListItem;
}) => (
  <div className="flex flex-col gap-2 text-sm">
    <CredentialRow label="API key" present={integration.hasApiKey} />
    <CredentialRow
      label="Webhook secret"
      present={integration.hasWebhookSecret}
    />
  </div>
);

/** Last connection-test result, or `null` when the connection never ran one. */
export const TestStatus = ({
  integration,
}: {
  integration: IntegrationListItem;
}) => {
  if (!integration.lastTestedAt) return null;

  const hasPassed = integration.lastTestStatus === "SUCCESS";

  return (
    <div className="flex items-center gap-2 text-sm">
      {hasPassed ? (
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
  );
};
