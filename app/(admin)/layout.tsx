import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./admin.css";

import { Container } from "./_components/container";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { QueryProvider } from "../../components/providers/query-provider";
import { ModalProvider } from "./_components/providers/modal-provider";
import { SheetProvider } from "./_components/providers/sheet-provider";
import { getSettings } from "@/data/settings";
import { ProgressLoader } from "./_components/progress-loader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./_components/sidebar-v2/app-sidebar";
import { Header } from "./_components/header";
import HolyLoader from "holy-loader";
import { requireAdminAuth, requireAuth } from "@/lib/auth-utils";

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
      <HolyLoader />
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
        >
          <ToastProvider />
          <QueryProvider>
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
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
