import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { TitleForm } from "@/components/general-fields/title-form";
import { SlugForm } from "@/components/general-fields/slug-form";
import { DescriptionForm } from "@/components/general-fields/description-form";

import { StatusView } from "./_components/status-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoEditView } from "@/components/seo/seo-edit-view";
import { SeoContentTypeApi } from "@/components/seo/types";

const TagIdPage = async ({ params }: { params: { tagId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const tag = await db.tag.findUnique({
    where: {
      id: params.tagId,
    },
    include: {
      seo: true,
    },
  });

  if (!tag) {
    redirect("/admin/tags");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto ">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Tag setup</h1>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 py-8">
        <div className="col-span-full md:col-span-4 lg:col-span-9 flex flex-col gap-y-4">
          <Tabs defaultValue="tag">
            <TabsList className="mb-4">
              <TabsTrigger value="tag">Tag</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="tag" className="flex flex-col gap-y-4">
              <TitleForm
                initialData={tag}
                placeholder="Pagina uno"
                apiUrl={`/api/tags/${tag.id}/seo`}
              />
              <DescriptionForm
                initialData={tag}
                placeholder="Analisi pagina uno di sceneggiature famose"
                apiUrl={`/api/tags/${tag.id}/seo`}
              />
              <SlugForm
                initialData={tag}
                placeholder="pagina-uno"
                apiUrl={`/api/tags/${tag.id}/seo`}
              />
            </TabsContent>
            <TabsContent value="seo">
              <SeoEditView
                initialData={tag.seo}
                contentType={SeoContentTypeApi.Tag}
                contentId={tag.id}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={false}
            tagId={tag.id}
            isPublished={tag.isPublished}
            lastSavedAt={tag.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default TagIdPage;
