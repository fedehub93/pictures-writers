import type { Metadata } from "next";
import { Mulish } from "next/font/google";
// import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from "@next/third-parties/google";

import "./home.css";

import { cn } from "@/lib/utils";

import { ToastProvider } from "@/components/providers/toast-provider";
import { Navbar } from "@/app/(home)/_components/navbar";
import Footer from "@/app/(home)/_components/footer";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

import { QueryProvider } from "@/components/providers/query-provider";
import { OrganizationJsonLd } from "./_components/seo/json-ld/organization";
import CookieBanner from "./_components/cookie-banner";

const mulish = Mulish({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata | null> {
  return await getHeadMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={mulish.className}>
        <OrganizationJsonLd
          name="Pictures Writers"
          url="https://pictureswriters.com"
          logo="https://pictureswriters.com/logo.png"
        />
        <ToastProvider />
        <QueryProvider>
          <div className={cn(`h-full`, mulish.className)}>
            <Navbar />
            <main className="pt-20">{children}</main>
            <Footer />
          </div>
        </QueryProvider>
        <CookieBanner />
        {/* <SpeedInsights /> */}
      </body>
      {process.env.NODE_ENV === "production" && (
        <GoogleTagManager gtmId={process.env.NEXT_GTAG_CONTAINER_ID!} />
      )}
    </html>
  );
}
