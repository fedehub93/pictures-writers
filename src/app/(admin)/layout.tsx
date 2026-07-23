import type { Metadata } from "next";
import { Inter } from "next/font/google";
import HolyLoader from "holy-loader";
import { NuqsAdapter } from "nuqs/adapters/next";

import "./admin.css";
import "@/puck/styles/puck-base.css";

import { Toaster } from "@/shared/ui/sonner";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";

import { ThemeProvider } from "@/shared/providers/theme-provider";
import { ToastProvider } from "@/shared/providers/toast-provider";
import { QueryProvider } from "@/shared/providers/query-provider";
import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { getSettings } from "@/data/settings";

import { Container } from "./_components/container";
import { ModalProvider } from "./_components/providers/modal-provider";
import { SheetProvider } from "./_components/providers/sheet-provider";
import { ProgressLoader } from "./_components/progress-loader";
import { AppSidebar } from "./_components/sidebar-v2/app-sidebar";
import { Header } from "./_components/header";
import { TRPCReactProvider } from "@/trpc/client";

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
  const user = await requireAdminAuth();

  return (
    <html lang="en" suppressHydrationWarning>
      <HolyLoader color="var(--primary)" />
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
        >
          <ToastProvider />
          <NuqsAdapter>
            <TRPCReactProvider>
              <SidebarProvider className="h-screen">
                <AppSidebar />
                <SidebarInset>
                  <Header user={user} />
                  <Container>{children}</Container>
                </SidebarInset>
                <ModalProvider />
                <SheetProvider />
                <ProgressLoader />
              </SidebarProvider>
            </TRPCReactProvider>
          </NuqsAdapter>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
