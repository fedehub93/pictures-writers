import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TitleForm } from "@/components/general-fields/title-form";
import { DescriptionForm } from "@/components/general-fields/description-form";
import { SeoContentTypeApi } from "@/components/seo/types";
import { StatusView } from "@/components/content/status-view";
import { ContentIdActions } from "@/components/content/content-id-actions";
import { ImageForm } from "./_components/image-form";
import { FileForm } from "./_components/file-form";

const EbookIdPage = async ({ params }: { params: { ebookId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return auth().redirectToSignIn();
  }

  const ebook = await db.ebook.findUnique({
    where: {
      id: params.ebookId,
    },
    include: {
      user: true,
    },
  });

  if (!ebook) {
    redirect("/admin/ebooks");
  }

  const requiredFields = [ebook.title, ebook.description, ebook.imageCoverUrl];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Ebook setup</h1>
        <div className="flex items-center gap-x-2">
          <span className="text-sm text-slate-700">
            Complete all fields {completionText}
          </span>
          <ContentIdActions
            contentType={SeoContentTypeApi.Ebook}
            contentId={ebook.id}
          />
        </div>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-8 h-full">
        <div className="col-span-full md:col-span-4 lg:col-span-9 overflow-auto">
          <Tabs defaultValue="post">
            <TabsList className="mb-4">
              <TabsTrigger value="post">Ebook</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="post" className="flex flex-col gap-y-4 pb-8">
              <TitleForm
                initialData={ebook}
                placeholder="e.g. Screenplay 101"
                apiUrl={`/api/ebooks/${ebook.id}`}
              />
              <DescriptionForm
                initialData={ebook}
                placeholder="e.g. This e-book shows you how to write a screenplay from scratch. Learn More."
                apiUrl={`/api/ebooks/${ebook.id}`}
              />
              <ImageForm initialData={ebook} ebookId={ebook.id} />
              <FileForm initialData={ebook} ebookId={ebook.id} />
            </TabsContent>
            <TabsContent value="seo">
              {/* <SeoEditView
                initialData={post.seo}
                contentType={SeoContentTypeApi.Post}
                contentId={post.id}
              /> */}
            </TabsContent>
          </Tabs>
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={!isComplete}
            contentType={SeoContentTypeApi.Ebook}
            contentId={ebook.id}
            isPublished={true}
            lastSavedAt={ebook.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default EbookIdPage;
