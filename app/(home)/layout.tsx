import type { Metadata } from "next";
import { Figtree } from "next/font/google";
// import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from "@next/third-parties/google";

import "./home.css";

import { cn } from "@/lib/utils";

import { ToastProvider } from "@/components/providers/toast-provider";
import { getSettings } from "@/data/settings";
import { Navbar } from "@/app/(home)/_components/navbar";
import { Footer } from "@/app/(home)/_components/footer";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

import { QueryProvider } from "@/components/providers/query-provider";
import { AppScripts } from "@/components/scripts";

import { OrganizationJsonLd } from "./_components/seo/json-ld/organization";
import { BottomBanner } from "./_components/bottom-banner";

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
  const settings = await getSettings();

  return (
    <html lang="it" suppressHydrationWarning>
      <body className={figtree.className}>
        <OrganizationJsonLd
          name={settings.siteName!}
          url={`${settings.siteUrl!}/`}
          logo={`${settings.siteUrl}${settings.logoUrl}`}
        />
        <ToastProvider />
        <QueryProvider>
          <div className={cn(`h-full`, figtree.className)}>
            <Navbar />
            <main className="pt-20">{children}</main>
            <Footer />
            <BottomBanner />
          </div>
        </QueryProvider>
        {/* <SpeedInsights /> */}
        {process.env.NODE_ENV === "production" && (
          <AppScripts scripts={settings.scripts} />
        )}
      </body>
      {process.env.NODE_ENV === "production" && (
        <>
          <GoogleTagManager gtmId={process.env.NEXT_GTAG_CONTAINER_ID!} />
        </>
      )}
    </html>
  );
}
