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
      returnBackUrl: "http://localhost:3000/admin",
    });
  }

  if (user.role === UserRole.USER) {
    return (await auth()).redirectToSignIn({
      returnBackUrl: "http://localhost:3000/admin",
    });
  }

  return (
    <div className="flex flex-col -mx-8 -mt-6">
      <div className="h-16 bg-rose-500 text-white w-full text-3xl font-bold flex items-center justify-center shadow-md mb-4">
        Shop
      </div>
      {children}
    </div>
  );
}
