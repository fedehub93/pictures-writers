import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import "./admin.css";

import { getSelf } from "@/lib/current-user";
import { Sidebar } from "./_components/sidebar";
import { Container } from "./_components/container";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { QueryProvider } from "../../components/providers/query-provider";
import { ModalProvider } from "./_components/providers/modal-provider";
import { SheetProvider } from "./_components/providers/sheet-provider";
import { getSettings } from "@/data/settings";
import { ProgressLoader } from "./_components/progress-loader";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata | null> {
  const settings = await getSettings();

  return settings.seo;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSelf();

  if (!user) {
    return (await auth()).redirectToSignIn({
      returnBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
    });
  }

  if (user.role === UserRole.USER) {
    return (await auth()).redirectToSignIn({
      returnBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin`,
    });
  }

  const settings = await getSettings();

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
          >
            <ToastProvider />
            <QueryProvider>
              <div className="relative h-full overflow-hidden bg-background">
                <Sidebar
                  siteName={settings.siteName}
                  logoUrl={settings.logoUrl}
                />
                <Container user={user}>{children}</Container>
                <ModalProvider />
                <SheetProvider />
                <ProgressLoader />
              </div>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
