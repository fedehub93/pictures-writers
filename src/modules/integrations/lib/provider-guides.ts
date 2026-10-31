import type { IntegrationProvider } from "./constants";

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

/** The complete setup checklist for one integration provider. */
export interface ProviderSetupGuide {
  title: string;
  intro?: string;
  steps: ProviderSetupStep[];
}

/**
 * Provider setup guides, keyed by `IntegrationProvider`. Each provider owns
 * its external configuration story, so adding a provider means adding an
 * entry here; a `null` entry means the provider has no guide yet.
 */
export const PROVIDER_SETUP_GUIDES: Record<
  IntegrationProvider,
  ProviderSetupGuide | null
> = {
  resend: {
    title: "Configuring Resend",
    intro:
      "Resend credentials are stored encrypted in the database and are write-only. Follow these steps to connect your account.",
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
          "A sending-only key cannot read received email. Create a full-access key in Resend and paste it into this integration's credentials.",
        code: ["Integrations → Resend → Edit credentials"],
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
          "Copy the endpoint's signing secret and paste it into the Resend integration's credentials. It is stored encrypted and never returned to the browser.",
        code: ["Integrations → Resend → Edit credentials"],
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
  iubenda: {
    title: "Configuring Iubenda",
    intro:
      "Iubenda stores only public identifiers. Once the configuration is complete, enable the integration to render the consent banner on the public site. The Iubenda GTM template must be active for Google Consent Mode.",
    steps: [
      {
        title: "Open the Cookie Solution embed",
        description:
          "In the Iubenda dashboard open Privacy Controls and Cookie Solution → Embed and copy the numeric site ID and cookie policy ID from the generated snippet.",
        links: [
          {
            label: "Iubenda dashboard",
            href: "https://www.iubenda.com/dashboard",
          },
        ],
      },
      {
        title: "Match the banner language",
        description:
          "Choose the language of the public site. Italian and English are available in the form.",
      },
      {
        title: "Choose the loader",
        description:
          "Keep autoblocking on for the recommended loader that blocks third parties before consent. Turn it off to use the sync loader instead.",
      },
      {
        title: "Keep the GTM template active",
        description:
          "In Google Tag Manager, activate the iubenda Privacy Controls and Cookie Solution template with a Consent Initialization - All Pages trigger. It sets default consent to denied and applies the banner's updates. If you turn this option off in the integration, pause this tag as well.",
        links: [
          {
            label: "GTM setup guide",
            href: "https://www.iubenda.com/en/help/74198-google-consent-mode-set-up-google-tag-manager-with-iubenda",
          },
        ],
      },
      {
        title: "Enable the integration",
        description:
          "Save the configuration, then enable Iubenda. The banner and its scripts render in the document head on the next request.",
      },
    ],
  },
  gtm: {
    title: "Configuring Google Tag Manager",
    intro:
      "Google Tag Manager stores only the public container id. GA4 and every other tag live inside the container, not in this app; consent stays with the Iubenda template.",
    steps: [
      {
        title: "Find the container id",
        description:
          "In Google Tag Manager open Admin → Container → Install Google Tag Manager and copy the id shown in the snippet. It looks like GTM-XXXXXXX: paste the id only, not the whole snippet.",
        code: ["GTM-XXXXXXX"],
        links: [
          { label: "Tag Manager dashboard", href: "https://tagmanager.google.com/" },
        ],
      },
      {
        title: "Keep the tags inside the container",
        description:
          "GA4 and the other tags are configured and published in the GTM workspace. This integration only stores the container id, so changes to tags and triggers do not require a deploy.",
        links: [
          {
            label: "Tag Manager quick start",
            href: "https://support.google.com/tagmanager/answer/6103696",
          },
        ],
      },
      {
        title: "Leave Consent Mode to Iubenda",
        description:
          "Keep the iubenda Privacy Controls and Cookie Solution template active in the container with a Consent Initialization - All Pages trigger. It sets consent to denied before a choice and forwards the banner's updates to every tag; the GTM integration does not manage consent.",
        links: [
          {
            label: "GTM setup guide",
            href: "https://www.iubenda.com/en/help/74198-google-consent-mode-set-up-google-tag-manager-with-iubenda",
          },
        ],
      },
      {
        title: "Save the container id",
        description:
          "Paste the id into the Container ID field and save. No credentials or connection test are needed: the id is public, so Tag Assistant against the public site is the real verification.",
      },
    ],
  },
};
