import "client-only";

import { ExternalLinkIcon } from "lucide-react";

import type { IntegrationProvider } from "@/modules/integrations/lib";
import { PROVIDER_SETUP_GUIDES } from "@/modules/integrations/lib/provider-guides";

interface ProviderSetupGuideProps {
  provider: IntegrationProvider;
}

/**
 * Data-driven checklist of the external configuration a provider requires.
 * Rendered inside the integration details dialog.
 */
export const ProviderSetupChecklist = ({
  provider,
}: ProviderSetupGuideProps) => {
  const guide = PROVIDER_SETUP_GUIDES[provider];

  if (!guide) {
    return (
      <p className="text-sm text-muted-foreground">
        This provider is not integrated yet. Configure it on the provider
        dashboard; a step-by-step guide will appear here once the adapter is
        available.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-y-1">
        <span className="text-sm font-medium">{guide.title}</span>
        {guide.intro ? (
          <p className="text-sm text-muted-foreground">{guide.intro}</p>
        ) : null}
      </div>
      <ol className="flex flex-col gap-y-5">
        {guide.steps.map((step, index) => (
          <li key={step.title} className="flex gap-x-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {index + 1}
            </span>
            <div className="flex flex-col gap-y-1">
              <span className="text-sm font-medium">{step.title}</span>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
              {step.code?.length ? (
                <div className="flex flex-wrap gap-1">
                  {step.code.map((token) => (
                    <code
                      key={token}
                      className="rounded bg-muted px-1 py-0.5 font-mono text-xs break-all"
                    >
                      {token}
                    </code>
                  ))}
                </div>
              ) : null}
              {step.links?.length ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {step.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-x-1 text-xs font-medium text-primary hover:underline"
                    >
                      {link.label}
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
