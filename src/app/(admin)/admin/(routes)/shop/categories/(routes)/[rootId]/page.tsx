import { redirect } from "next/navigation";

import { db } from "@/lib/db";

import { requireAdminAuth } from "@/lib/auth-utils";

import { CategoryForm } from "./_components/category-form";

const CategoryIdPage = async (props: {
  params: Promise<{ rootId: string }>;
}) => {
  await requireAdminAuth();

  const params = await props.params;

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

  return (
    <CategoryForm
      initialData={category}
      apiUrl={`/api/admin/shop/categories/${category.rootId}`}
    />
  );
};

export default CategoryIdPage;
