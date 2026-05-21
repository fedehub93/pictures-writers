import { requireUnauth } from "@/lib/auth-utils";
import { LoginForm } from "./_components/sign-in-form";


const Page = async () => {
  await requireUnauth();

  return <LoginForm />;
};

export default Page;
