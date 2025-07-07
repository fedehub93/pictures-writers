import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { API_ADMIN_COMPETITIONS } from "@/constants/api";

import { ContestForm } from "../details/_components/contest-form";
import { CategoriesForm } from "./_components/categories-form";

type Params = Promise<{ rootId: string }>;
type SearchParams = Promise<{ [key: string]: string | undefined }>;

interface CategoriesPage {
  params: Params;
  searchParams: SearchParams;
}

const CategoriesPage = async (props: CategoriesPage) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const params = await props.params;
  const searchParams = await props.searchParams;

  const activeLanguages = await db.language.findMany({
    where: {
      isActive: true,
    },
  });

  const langId =
    searchParams.langId ||
    (activeLanguages.find((l) => l.isDefault)?.id as string);

  const language = activeLanguages.find((l) => l.id === langId);

  if (!language) {
    return redirect("/admin/contests");
  }

  const contest = await db.contest.findFirst({
    where: {
      rootId: params.rootId,
    },
    include: {
      categories: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!contest || !contest.id) {
    return redirect("/admin/contests");
  }

  return (
    <CategoriesForm
      key={langId}
      initialData={contest}
      langId={langId}
      languages={activeLanguages}
      apiUrl={`${API_ADMIN_COMPETITIONS}/${contest.id}`}
    />
  );
};

export default CategoriesPage;
