import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { API_ADMIN_COMPETITIONS } from "@/constants/api";

import { ContestForm } from "../details/_components/contest-form";
import { PricesForm } from "./_components/prices-form";

type Params = Promise<{ rootId: string }>;
type SearchParams = Promise<{ [key: string]: string | undefined }>;

interface ContestPricesPage {
  params: Params;
  searchParams: SearchParams;
}

const ContestPricesPage = async (props: ContestPricesPage) => {
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
      deadlines: true,
      prices: {
        include: {
          deadline: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!contest || !contest.id) {
    return redirect("/admin/contests");
  }

  return (
    <PricesForm
      key={langId}
      initialData={contest}
      apiUrl={`${API_ADMIN_COMPETITIONS}/${contest.id}`}
    />
  );
};

export default ContestPricesPage;
