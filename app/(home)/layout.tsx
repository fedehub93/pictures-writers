import type { Metadata, ResolvingMetadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Mulish } from "next/font/google";

import "./home.css";

import { cn } from "@/lib/utils";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Navbar } from "@/app/(home)/_components/navbar";
import Footer from "@/app/(home)/_components/footer";
import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";

import { QueryProvider } from "@/components/providers/query-provider";
import { OrganizationJsonLd } from "./_components/seo/json-ld/organization";

const mulish = Mulish({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  return await getHeadMetadata();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="it" suppressHydrationWarning>
        <body className={mulish.className}>
          <OrganizationJsonLd
            name="Pictures Writers"
            url="https://pictureswriters.com"
            logo="https://pictureswriters.com/logo.png"
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
          >
            <ToastProvider />
            <QueryProvider>
              <div className={cn(`h-full`, mulish.className)}>
                <Navbar />
                <main className="pt-20">{children}</main>
                <Footer />
              </div>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
