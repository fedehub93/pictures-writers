import type { Metadata } from "next";
import { Suspense } from "react";
import { Figtree } from "next/font/google";
import HolyLoader from "holy-loader";

import "./home.css";
import "@/puck/styles/puck-base.css";

import { cn } from "@/shared/lib/utils";

import { ToastProvider } from "@/shared/providers/toast-provider";
import { getSettings } from "@/data/settings";
import { INTEGRATION_PROVIDER_IUBENDA } from "@/modules/integrations/lib/constants";
import { resolveIntegrationPublicConfig } from "@/modules/integrations/lib/public-config";
import { withIntegrationResolutionCache } from "@/modules/integrations/lib/resolution-cache";

import { Navbar } from "@/app/(home)/_components/navbar";
import { Footer } from "@/app/(home)/_components/footer";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

import { QueryProvider } from "@/shared/providers/query-provider";
import { AppScripts } from "@/shared/components/scripts";

import { OrganizationJsonLd } from "./_components/seo/json-ld/organization";
import { WebSiteJsonLd } from "./_components/seo/json-ld/website";
import { PageViewTracker } from "./_components/page-view-tracker";
import { PublicHeadScripts } from "./_components/public-head-scripts";

const figtree = Figtree({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  const { siteUrl } = await getSettings();

  return {
    ...metadata,
    alternates: {
      canonical: `${siteUrl}/`,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, iubendaConfig] = await Promise.all([
    getSettings(),
    withIntegrationResolutionCache(() =>
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ),
  ]);

  const socialUrls = settings.socials
    .filter((s): s is typeof s & { url: string } => !!s.url)
    .map((s) => s.url);
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <PublicHeadScripts
          iubendaConfig={iubendaConfig}
          gtmId={
            process.env.NODE_ENV === "production"
              ? process.env.NEXT_GTAG_CONTAINER_ID
              : undefined
          }
        />
      </head>
      <HolyLoader color="var(--primary)" />
      <body className={figtree.className}>
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <OrganizationJsonLd
          name={settings.siteName!}
          url={`${settings.siteUrl!}/`}
          logo={`${settings.siteUrl}${settings.logoUrl}`}
          description={settings.seo?.description || undefined}
          sameAs={socialUrls}
        />
        <WebSiteJsonLd
          name={settings.siteName!}
          url={`${settings.siteUrl!}/`}
          description={settings.seo?.description || undefined}
        />
        <ToastProvider />
        <QueryProvider>
          <div className={cn(`h-full`, figtree.className)}>
            <Navbar />
            <main className="pt-32 md:pt-28">{children}</main>
            <Footer />
          </div>
        </QueryProvider>
        {process.env.NODE_ENV === "production" && (
          <AppScripts scripts={settings.scripts} />
        )}
      </body>
    </html>
  );
}
