import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";

type Params = Promise<{ rootId: string }>;
type SearchParams = Promise<{ [key: string]: string | undefined }>;

interface ContestIdPageProps {
  params: Params;
  searchParams: SearchParams;
}

const ContestIdPage = async (props: ContestIdPageProps) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const p = await props.params;

  return redirect(`/admin/contests/${p.rootId}/details`);
};

export default ContestIdPage;
