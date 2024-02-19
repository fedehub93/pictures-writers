import { getSelf } from "@/lib/current-user";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const AdminPage = async () => {
  const user = await getSelf();
  if (!user) {
    return redirectToSignIn();
  }

  return redirect("/admin/dashboard");
};

export default AdminPage;
