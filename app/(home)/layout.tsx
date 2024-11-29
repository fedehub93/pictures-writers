import type { Metadata } from "next";
import { Mulish } from "next/font/google";
// import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from "@next/third-parties/google";

import "./home.css";

import { cn } from "@/lib/utils";

import { ToastProvider } from "@/components/providers/toast-provider";
import { getSettings } from "@/data/settings";
import { Navbar } from "@/app/(home)/_components/navbar";
import Footer from "@/app/(home)/_components/footer";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

import { QueryProvider } from "@/components/providers/query-provider";
import { OrganizationJsonLd } from "./_components/seo/json-ld/organization";
import Script from "next/script";
import IubendaScript from "./_components/iubenda";
import AppScripts from "@/components/scripts";

const mulish = Mulish({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata | null> {
  return await getHeadMetadata();
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

  return (
    <html lang="it" suppressHydrationWarning>
      <body className={mulish.className}>
        <OrganizationJsonLd
          name={settings.siteName!}
          url={settings.siteUrl!}
          logo={`${settings.siteUrl}${settings.logoUrl}`}
        />
        <ToastProvider />
        <QueryProvider>
          <div className={cn(`h-full`, mulish.className)}>
            <Navbar />
            <main className="pt-20">{children}</main>
            <Footer />
          </div>
        </QueryProvider>
        {/* {settings.cookieConsent ? <CookieBannerV2 /> : <CookieBanner />} */}
        {/* <SpeedInsights /> */}
      </body>
      {process.env.NODE_ENV === "production" && (
        <>
          <GoogleTagManager gtmId={process.env.NEXT_GTAG_CONTAINER_ID!} />
          {/* <IubendaScript /> */}
          <AppScripts scripts={settings.scripts} />
        </>
      )}
    </html>
  );
}
