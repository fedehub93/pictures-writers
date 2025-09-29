import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

import { getSelf } from "@/lib/current-user";

export default async function Layout({
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

  return (
    <div className="flex flex-col">
      <div className="h-16 bg-rose-500 text-white w-full text-3xl font-bold flex items-center justify-center shadow-md mb-4">
        Shop
      </div>
      {children}
    </div>
  );
}
