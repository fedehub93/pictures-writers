import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TitleForm } from "@/components/general-fields/title-form";
import { SlugForm } from "@/components/general-fields/slug-form";
import { DescriptionForm } from "@/components/general-fields/description-form";

import { SeoEditView } from "@/components/seo/seo-edit-view";
import { SeoContentTypeApi } from "@/components/seo/types";
import { StatusView } from "@/components/content/status-view";

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
    include: {
      seo: true,
    },
  });

  if (!category) {
    redirect("/admin/categories");
  }

  const requiredFields = [category.title, category.slug];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto ">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Category setup</h1>
        <span className="text-sm text-slate-700">
          Complete all fields {completionText}
        </span>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 py-8">
        <div className="col-span-full md:col-span-4 lg:col-span-9 flex flex-col gap-y-4">
          <Tabs defaultValue="category">
            <TabsList className="mb-4">
              <TabsTrigger value="category">Category</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="category" className="flex flex-col gap-y-4">
              <TitleForm
                initialData={category}
                placeholder="Screenwriting"
                apiUrl={`/api/categories/${category.id}`}
              />
              <DescriptionForm
                initialData={category}
                placeholder="All about screenwriting"
                apiUrl={`/api/categories/${category.id}`}
              />
              <SlugForm
                initialData={category}
                placeholder="screenwriting"
                apiUrl={`/api/categories/${category.id}`}
              />
            </TabsContent>
            <TabsContent value="seo">
              <SeoEditView
                initialData={category.seo}
                contentType={SeoContentTypeApi.Category}
                contentId={category.id}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={!isComplete}
            contentType={SeoContentTypeApi.Category}
            contentId={category.id}
            isPublished={category.isPublished}
            lastSavedAt={category.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryIdPage;
