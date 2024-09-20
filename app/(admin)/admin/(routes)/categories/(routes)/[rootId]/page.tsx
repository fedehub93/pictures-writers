import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TitleForm } from "@/app/(admin)/general-fields/title-form";
import { SlugForm } from "@/app/(admin)/general-fields/slug-form";
import { DescriptionForm } from "@/app/(admin)/general-fields/description-form";

import { SeoEditView } from "@/app/(admin)/_components/seo/seo-edit-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";
import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { ContentIdActions } from "@/app/(admin)/_components/content/content-id-actions";

const CategoryIdPage = async ({ params }: { params: { rootId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return auth().redirectToSignIn();
  }

  const category = await db.category.findFirst({
    where: {
      rootId: params.rootId,
    },
    include: { seo: true },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!category || !category.rootId) {
    redirect("/admin/categories");
  }

  const requiredFields = [category.title, category.slug];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Category setup</h1>
        <div className="flex items-center gap-x-2">
          <span className="text-sm text-slate-700">
            Complete all fields {completionText}
          </span>
          <ContentIdActions
            contentType={SeoContentTypeApi.Category}
            contentRootId={category.rootId}
            contentId={category.id}
          />
        </div>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 py-8 h-full">
        <div className="col-span-full md:col-span-4 lg:col-span-9 flex flex-col gap-y-4 overflow-auto">
          <Tabs defaultValue="category">
            <TabsList className="mb-4">
              <TabsTrigger value="category">Category</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="category" className="flex flex-col gap-y-4">
              <TitleForm
                initialData={category}
                placeholder="Screenwriting"
                apiUrl={`/api/categories/${category.rootId}`}
              />
              <DescriptionForm
                initialData={category}
                placeholder="All about screenwriting"
                apiUrl={`/api/categories/${category.rootId}`}
              />
              <SlugForm
                initialData={category}
                placeholder="screenwriting"
                apiUrl={`/api/categories/${category.rootId}`}
              />
            </TabsContent>
            <TabsContent value="seo">
              <SeoEditView
                initialData={category.seo}
                contentType={SeoContentTypeApi.Category}
                contentRootId={category.rootId}
                contentId={category.id}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={!isComplete}
            contentType={SeoContentTypeApi.Category}
            contentRootId={category.rootId}
            contentId={category.id}
            status={category.status}
            lastSavedAt={category.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryIdPage;
