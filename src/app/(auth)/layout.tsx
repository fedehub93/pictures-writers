import { Inter } from "next/font/google";

import "./auth.css";
import { Toaster } from "@/shared/ui/sonner";

import { ThemeProvider } from "@/shared/providers/theme-provider";
import { ToastProvider } from "@/shared/providers/toast-provider";

const inter = Inter({ subsets: ["latin"] });

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
        >
          <ToastProvider />
          <div className="h-full flex items-center justify-center">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
};

export default AuthLayout;
