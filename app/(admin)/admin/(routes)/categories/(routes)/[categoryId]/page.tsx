import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { TitleForm } from "./_components/title-form";
import { SlugForm } from "./_components/slug-form";
import { StatusView } from "./_components/status-view";
import { DescriptionForm } from "./_components/description-form";

const CategoryIdPage = async ({
  params,
}: {
  params: { categoryId: string };
}) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const category = await db.category.findUnique({
    where: {
      id: params.categoryId,
    },
  });

  if (!category) {
    redirect("/admin/categories");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto ">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Category setup</h1>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 py-8">
        <div className="col-span-full md:col-span-4 lg:col-span-9 flex flex-col gap-y-4">
          <TitleForm initialData={category} categoryId={category.id} />
          <DescriptionForm initialData={category} categoryId={category.id} />
          <SlugForm initialData={category} categoryId={category.id} />
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={false}
            categoryId={category.id}
            isPublished={category.isPublished}
            lastSavedAt={category.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryIdPage;
