import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";

import "./admin.css";

import { Sidebar } from "./_components/sidebar";
import { Container } from "./_components/container";
import { getSelf } from "@/lib/current-user";
import { ModalProvider } from "./_components/providers/modal-provider";

const AdminLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await getSelf();

  if (!user) {
    return auth().redirectToSignIn({
      returnBackUrl: "http://localhost:3000/admin",
    });
  }

  if (user.role === UserRole.USER) {
    return auth().redirectToSignIn({
      returnBackUrl: "http://localhost:3000/admin",
    });
  }

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <Sidebar />
      <Container>{children}</Container>
    </div>
  );
};

export default AdminLayout;
