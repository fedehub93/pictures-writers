import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
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

  return (
    <CategoryForm
      initialData={category}
      apiUrl={`/api/admin/shop/categories/${category.rootId}`}
    />
  );
};

export default CategoryIdPage;
