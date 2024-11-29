import { getSelf } from "@/lib/current-user";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const AdminPage = async () => {
  const user = await getSelf();
  if (!user) {
    return (await auth()).redirectToSignIn();
  }

  return redirect("/admin/dashboard");
};

export default AdminPage;
