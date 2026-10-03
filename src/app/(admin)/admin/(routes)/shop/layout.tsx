import { requireAdminAuth } from "@/lib/auth-utils";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminAuth();

  return (
    <div className="flex flex-col flex-1">
      <div className="h-20 bg-accent text-accent-foreground w-full text-3xl font-bold flex items-center justify-center shadow-md mb-4">
        Shop
      </div>
      {children}
    </div>
  );
}
