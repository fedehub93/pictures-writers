import { redirectToSignIn } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";

import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { Container } from "./_components/container";
import { getSelf } from "@/lib/current-user";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getSelf();

  if (!user) {
    return redirectToSignIn();
  }

  if (user.role === UserRole.USER) {
    return redirectToSignIn();
  }

  return (
    <>
      <Navbar />
      <div className="flex h-full pt-20">
        <Sidebar />
        <Container>{children}</Container>
      </div>
    </>
  );
};

export default AdminLayout;
