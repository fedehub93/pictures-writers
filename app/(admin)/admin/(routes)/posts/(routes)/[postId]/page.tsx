import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TitleForm } from "@/components/general-fields/title-form";
import { SlugForm } from "@/components/general-fields/slug-form";

import { ContentForm } from "./_components/content-form";
import { ImageForm } from "./_components/image-form";
import { CategoryForm } from "./_components/category-form";
import { DescriptionForm } from "@/components/general-fields/description-form";
import { TagForm } from "./_components/tag-form";
import { SeoEditView } from "@/components/seo/seo-edit-view";
import { SeoContentTypeApi } from "@/components/seo/types";
import { StatusView } from "@/components/content/status-view";
import { ContentIdActions } from "@/components/content/content-id-actions";

const PostIdPage = async ({ params }: { params: { postId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return auth().redirectToSignIn();
  }

  const post = await db.post.findUnique({
    where: {
      id: params.postId,
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      seo: true,
    },
  });

  if (!post) {
    redirect("/admin/posts");
  }

  const categories = await db.category.findMany({
    orderBy: {
      title: "asc",
    },
  });

  const tags = await db.tag.findMany({
    orderBy: {
      title: "asc",
    },
  });

  const requiredFields = [
    post.title,
    post.description,
    post.slug,
    post.imageCover,
    post.category && post.category.isPublished,
    post.tags.every((tag) => tag.isPublished),
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Post setup</h1>
        <div className="flex items-center gap-x-2">
          <span className="text-sm text-slate-700">
            Complete all fields {completionText}
          </span>
          <ContentIdActions
            contentType={SeoContentTypeApi.Post}
            contentId={post.id}
          />
        </div>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 pt-8 h-full">
        <div className="col-span-full md:col-span-4 lg:col-span-9 overflow-auto">
          <Tabs defaultValue="post">
            <TabsList className="mb-4">
              <TabsTrigger value="post">Post</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="post" className="flex flex-col gap-y-4 pb-8">
              <TitleForm
                initialData={post}
                placeholder="e.g. How to write a screenplay"
                apiUrl={`/api/posts/${post.id}`}
              />
              <DescriptionForm
                initialData={post}
                placeholder="e.g. This article shows you how to write a screenplay from scratch. Learn More."
                apiUrl={`/api/posts/${post.id}`}
              />
              <CategoryForm
                initialData={post}
                postId={post.id}
                options={categories.map((category) => ({
                  label: category.title,
                  value: category.id,
                  isPublished: category.isPublished,
                }))}
              />
              <ImageForm initialData={post} postId={post.id} />
              <ContentForm initialData={post} postId={post.id} />
              <SlugForm
                initialData={post}
                placeholder="how-to-write-a-screenplay"
                apiUrl={`/api/posts/${post.id}`}
              />
              <TagForm
                initialData={post}
                postId={post.id}
                options={tags.map((tag) => ({
                  label: tag.title,
                  value: tag.id,
                  isPublished: tag.isPublished,
                }))}
              />
            </TabsContent>
            <TabsContent value="seo">
              <SeoEditView
                initialData={post.seo}
                contentType={SeoContentTypeApi.Post}
                contentId={post.id}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={!isComplete}
            contentType={SeoContentTypeApi.Post}
            contentId={post.id}
            isPublished={post.isPublished}
            lastSavedAt={post.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default PostIdPage;
