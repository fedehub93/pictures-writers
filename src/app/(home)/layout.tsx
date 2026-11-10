import type { Metadata } from "next";
import { Suspense } from "react";
import { Figtree } from "next/font/google";
import HolyLoader from "holy-loader";

import "./home.css";
import "@/puck/styles/puck-base.css";

import { cn } from "@/shared/lib/utils";

import { ToastProvider } from "@/shared/providers/toast-provider";
import { getSettings } from "@/data/settings";
import {
  INTEGRATION_PROVIDER_GTM,
  INTEGRATION_PROVIDER_IUBENDA,
} from "@/modules/integrations/lib/constants";
import { resolveIntegrationPublicConfig } from "@/modules/integrations/lib/public-config";
import { withIntegrationResolutionCache } from "@/modules/integrations/lib/resolution-cache";

import { resolveRegionPuckData } from "@/modules/site-regions/lib/default-regions";
import { getHeaderClassName } from "@/modules/site-regions/lib/header-sticky";
import { getCachedLiveRegionByKey } from "@/modules/site-regions/server/queries";

import { PuckRender } from "@/puck/render-config";
import { renderConfigForRegion } from "@/puck/region/render-config";

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
  const [
    settings,
    iubendaConfig,
    gtmConfig,
    headerRegion,
    footerRegion,
  ] = await Promise.all([
    getSettings(),
    withIntegrationResolutionCache(() =>
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
    ),
    withIntegrationResolutionCache(() =>
      resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_GTM),
    ),
    getCachedLiveRegionByKey("HEADER"),
    getCachedLiveRegionByKey("FOOTER"),
  ]);

  const headerPuckData = resolveRegionPuckData("HEADER", headerRegion);
  const footerPuckData = resolveRegionPuckData("FOOTER", footerRegion);

  const socialUrls = settings.socials
    .filter((s): s is typeof s & { url: string } => !!s.url)
    .map((s) => s.url);
  return (
    <html lang="it" suppressHydrationWarning>
      {/* Keep the React-rendered head free of children. Iubenda's runtime
          inserts its core script before the first <script> in the document;
          React 19 hydrates a JSX <head> positionally and that insertion would
          shift the first managed node, failing hydration. The CMP block lives
          at the top of <body> instead (ADR 0031). */}
      <head />
      <HolyLoader color="var(--primary)" />
      <body className={figtree.className}>
        <PublicHeadScripts
          iubendaConfig={iubendaConfig}
          gtmId={gtmConfig?.containerId}
        />
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
          {/* Keep the wrapper at least viewport-high but let it grow with the
              page: a fixed height would clamp `position: sticky` to one
              viewport and the header would stop sticking on long pages. */}
          <div className={cn(`min-h-full`, figtree.className)}>
            {/* Sticky uses `position: sticky`, so the header stays in normal
                flow and `main` never needs a reserved offset. The switch only
                adds positioning; the surface comes from the region blocks. */}
            <header className={getHeaderClassName(headerPuckData)}>
              <PuckRender
                config={renderConfigForRegion("HEADER")}
                initialData={headerPuckData}
              />
            </header>
            <main>{children}</main>
            <footer>
              <PuckRender
                config={renderConfigForRegion("FOOTER")}
                initialData={footerPuckData}
              />
            </footer>
          </div>
        </QueryProvider>
        {process.env.NODE_ENV === "production" && (
          <AppScripts scripts={settings.scripts} />
        )}
      </body>
    </html>
  );
}
