import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { TitleForm } from "@/app/(admin)/_components/general-fields/title-form";
import { SlugForm } from "@/app/(admin)/_components/general-fields/slug-form";
import { DescriptionForm } from "@/app/(admin)/_components/general-fields/description-form";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoEditView } from "@/app/(admin)/_components/seo/seo-edit-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";
import { StatusView } from "@/app/(admin)/_components/content/status-view";
import { ContentIdActions } from "@/app/(admin)/_components/content/content-id-actions";

const TagIdPage = async (props: { params: Promise<{ rootId: string }> }) => {
  const params = await props.params;
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return (await auth()).redirectToSignIn();
  }

  const tag = await db.tag.findFirst({
    where: {
      rootId: params.rootId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      seo: true,
    },
    take: 1,
  });

  if (!tag || !tag.rootId) {
    redirect("/admin/tags");
  }

  const requiredFields = [tag.title, tag.slug];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Tag setup</h1>
        <div className="flex items-center gap-x-2">
          <span className="text-sm text-slate-700">
            Complete all fields {completionText}
          </span>
          <ContentIdActions
            contentType={SeoContentTypeApi.Tag}
            contentRootId={tag.rootId}
            contentId={tag.id}
          />
        </div>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 py-8 h-full">
        <div className="col-span-full md:col-span-4 lg:col-span-9 flex flex-col gap-y-4 overflow-auto">
          <Tabs defaultValue="tag">
            <TabsList className="mb-4">
              <TabsTrigger value="tag">Tag</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="tag" className="flex flex-col gap-y-4">
              <TitleForm
                initialData={tag}
                placeholder="Pagina uno"
                apiUrl={`/api/tags/${tag.rootId}`}
              />
              <DescriptionForm
                initialData={tag}
                placeholder="Analisi pagina uno di sceneggiature famose"
                apiUrl={`/api/tags/${tag.rootId}`}
              />
              <SlugForm
                initialData={tag}
                placeholder="pagina-uno"
                apiUrl={`/api/tags/${tag.rootId}`}
              />
            </TabsContent>
            <TabsContent value="seo">
              <SeoEditView
                initialData={tag.seo}
                contentType={SeoContentTypeApi.Tag}
                contentRootId={tag.rootId}
                contentId={tag.id}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={!isComplete}
            contentType={SeoContentTypeApi.Tag}
            contentRootId={tag.rootId}
            contentId={tag.id}
            status={tag.status}
            lastSavedAt={tag.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default TagIdPage;
