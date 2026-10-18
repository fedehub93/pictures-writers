import type { EmailProvider } from "@/generated/prisma";

/** An external documentation or dashboard link shown inside a setup step. */
export interface ProviderSetupLink {
  label: string;
  href: string;
}

/**
 * A single configuration step a provider requires outside the app. `code`
 * holds stable, provider-level tokens (environment variables, event names,
 * endpoint shapes) that the user copies verbatim.
 */
export interface ProviderSetupStep {
  title: string;
  description: string;
  code?: string[];
  links?: ProviderSetupLink[];
}

/** The complete setup checklist for one email provider. */
export interface ProviderSetupGuide {
  title: string;
  intro?: string;
  steps: ProviderSetupStep[];
}

/**
 * Provider setup guides, keyed by `EmailProvider`. Each adapter owns its own
 * external configuration story, so adding an adapter means adding an entry
 * here; a `null` entry means the provider has no guide yet.
 */
export const PROVIDER_SETUP_GUIDES: Record<
  EmailProvider,
  ProviderSetupGuide | null
> = {
  RESEND: {
    title: "Configuring Resend",
    intro:
      "Resend is configured from Settings → Integrations. Credentials are stored encrypted in the database and are write-only.",
    steps: [
      {
        title: "Verify a sending domain",
        description:
          "Add a domain in Resend → Domains and publish the SPF and DKIM records it provides. One-to-one email is sent from an Email Account address on this exact verified domain.",
        links: [{ label: "Domains dashboard", href: "https://resend.com/domains" }],
      },
      {
        title: "Enable receiving on the domain",
        description:
          "Open the domain's details, turn on Receiving and publish the MX record it shows with the lowest priority. If the domain already has mailboxes, receive on a subdomain (for example mail.your-domain) so existing email keeps working.",
        links: [
          {
            label: "Receiving docs",
            href: "https://resend.com/docs/dashboard/receiving/introduction",
          },
        ],
      },
      {
        title: "Create a full-access API key",
        description:
          "A sending-only key cannot read received email. Create a full-access key in Resend and paste it into Settings → Integrations → Resend.",
        code: ["Settings → Integrations → Resend"],
        links: [{ label: "API keys", href: "https://resend.com/api-keys" }],
      },
      {
        title: "Add the inbound webhook",
        description:
          "In Resend → Webhooks add an endpoint pointing to this app and subscribe only to the inbound email event. Keep the trailing slash in the URL.",
        code: ["https://<your-app>/api/webhooks/resend/", "email.received"],
        links: [{ label: "Webhooks", href: "https://resend.com/webhooks" }],
      },
      {
        title: "Store the webhook signing secret",
        description:
          "Copy the endpoint's signing secret and paste it into the Resend integration in Settings → Integrations. It is stored encrypted and never returned to the browser.",
        code: ["Settings → Integrations → Resend"],
      },
      {
        title: "Create an Email Account",
        description:
          "Use an address on the receiving domain, keep it active and assign the users who may use it. Inbound mail is matched to the account by its recipient address.",
      },
      {
        title: "Set the daily quota",
        description:
          "Max emails per day must match the provider plan (for example 100 on the free Resend plan). One-to-one replies and transactional sends count against it.",
      },
    ],
  },
  SENDGRID: null,
};
