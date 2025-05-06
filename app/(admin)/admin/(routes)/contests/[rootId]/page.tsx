import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { API_ADMIN_COMPETITIONS } from "@/constants/api";
import { ContestForm } from "./_components/contest-form";
import { getSelectedOrDefaultWhere } from "@/data/language";

type Params = Promise<{ rootId: string }>;
type SearchParams = Promise<{ [key: string]: string | undefined }>;

interface ContestIdPage {
  params: Params;
  searchParams: SearchParams;
}

const ContestIdPage = async (props: ContestIdPage) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const params = await props.params;
  const searchParams = await props.searchParams;
  const langId = searchParams.langId || null;

  const activeLanguages = await db.language.findMany({
    where: {
      isActive: true,
    },
  });
  const contest = await db.contest.findFirst({
    where: {
      rootId: params.rootId,
      ...getSelectedOrDefaultWhere(langId),
    },
    include: {
      imageCover: true,
      categories: true,
      deadlines: true,
      prices: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!contest || !contest.id) {
    redirect("/admin/contests");
  }
  return (
    <ContestForm
      initialData={contest}
      languages={activeLanguages}
      apiUrl={`${API_ADMIN_COMPETITIONS}/${contest.id}`}
    />
  );
};

export default ContestIdPage;
