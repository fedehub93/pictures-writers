"use client";

import { useState } from "react";
import { ExternalLinkIcon, HelpCircleIcon } from "lucide-react";

import type { EmailProvider } from "@/generated/prisma";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { Button } from "@/shared/ui/button";

import { PROVIDER_SETUP_GUIDES } from "@/modules/mails/lib/provider-guides";

interface ProviderSetupHelpProps {
  provider: EmailProvider;
}

const FALLBACK_TITLE = "Setup guide not available";
const FALLBACK_DESCRIPTION =
  "This provider is not integrated yet. Configure it on the provider dashboard; a step-by-step guide will appear here once the adapter is available.";

/**
 * Help affordance that explains the external configuration required by the
 * selected email provider. Content is data-driven per provider, so adapters
 * that are not integrated yet simply show a not-available notice.
 */
export const ProviderSetupHelp = ({ provider }: ProviderSetupHelpProps) => {
  const [open, setOpen] = useState(false);
  const guide = PROVIDER_SETUP_GUIDES[provider];

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6 text-muted-foreground"
        aria-label="Email provider setup guide"
        onClick={() => setOpen(true)}
      >
        <HelpCircleIcon className="size-4" />
      </Button>
      <ResponsiveDialog
        title={guide?.title ?? FALLBACK_TITLE}
        description={guide?.intro ?? FALLBACK_DESCRIPTION}
        open={open}
        onOpenChange={setOpen}
      >
        {guide ? (
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
        ) : null}
      </ResponsiveDialog>
    </>
  );
};
