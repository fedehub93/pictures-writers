import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TitleForm } from "@/app/(admin)/_components/general-fields/title-form";
import { SlugForm } from "@/app/(admin)/_components/general-fields/slug-form";
import { DescriptionForm } from "@/app/(admin)/_components/general-fields/description-form";

import { SeoEditView } from "@/app/(admin)/_components/seo/seo-edit-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";
import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { ContentIdActions } from "@/app/(admin)/_components/content/content-id-actions";
import { CategoryForm } from "./_components/category-form";

const CategoryIdPage = async (props: {
  params: Promise<{ rootId: string }>;
}) => {
  const params = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const category = await db.productCategory.findFirst({
    where: {
      rootId: params.rootId,
    },
    include: { seo: true },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!category || !category.rootId) {
    redirect("/admin/shop/categories");
  }

  const requiredFields = [category.title, category.slug];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <CategoryForm
      initialData={category}
      apiUrl={`/api/admin/shop/categories/${category.rootId}`}
    />
  );
};

export default CategoryIdPage;
