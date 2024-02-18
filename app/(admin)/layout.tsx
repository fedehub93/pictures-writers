import { redirectToSignIn } from "@clerk/nextjs";
import { UserRole } from "@prisma/client";

import { currentUser } from "@/lib/current-user";

import { Navbar } from "./_components/navbar";
import { Sidebar } from "./_components/sidebar";
import { Container } from "./_components/container";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await currentUser();

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
