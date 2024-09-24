import { auth } from "@clerk/nextjs/server";
import { ContentStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TitleForm } from "@/app/(admin)/general-fields/title-form";
import { DescriptionForm } from "@/app/(admin)/general-fields/description-form";
import { SlugForm } from "@/app/(admin)/general-fields/slug-form";

import { ImageForm } from "./_components/image-form";
import { CategoryForm } from "./_components/category-form";
import { ContentForm } from "./_components/content-form";
import { TagForm } from "./_components/tag-form";

import { SeoEditView } from "@/app/(admin)/_components/seo/seo-edit-view";
import { SeoContentTypeApi } from "@/app/(admin)/_components/seo/types";

import { StatusView } from "@/app/(admin)/_components/content/status-view";

import { ContentIdActions } from "@/app/(admin)/_components/content/content-id-actions";

const PostIdPage = async ({ params }: { params: { rootId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return auth().redirectToSignIn();
  }

  const post = await db.post.findFirst({
    where: {
      rootId: params.rootId,
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      imageCover: true,
      category: true,
      tags: true,
      seo: true,
    },
  });

  if (!post || !post.rootId) {
    return redirect("/admin/posts");
  }

  const categories = await db.category.findMany({
    distinct: ["rootId"],
    orderBy: [{ createdAt: "desc" }, { title: "asc" }],
  });

  const tags = await db.tag.findMany({
    distinct: ["rootId"],
    orderBy: [{ createdAt: "desc" }, { title: "asc" }],
  });

  const requiredFields = [
    post.title,
    post.description,
    post.slug,
    post.imageCover,
    post.category &&
      (post.category.status === ContentStatus.CHANGED ||
        post.category.status === ContentStatus.PUBLISHED),
    post.tags.every(
      (tag) =>
        tag.status === ContentStatus.CHANGED ||
        tag.status === ContentStatus.PUBLISHED
    ),
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
            contentRootId={post.rootId}
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
            <TabsContent value="post" className="flex flex-col gap-y-4">
              <TitleForm
                initialData={post}
                placeholder="e.g. How to write a screenplay"
                apiUrl={`/api/posts/${post.rootId}`}
              />
              <DescriptionForm
                initialData={post}
                placeholder="e.g. This article shows you how to write a screenplay from scratch. Learn More."
                apiUrl={`/api/posts/${post.rootId}`}
              />
              <CategoryForm
                initialData={post}
                rootId={post.rootId}
                postId={post.id}
                options={categories.map((category) => ({
                  label: category.title,
                  value: category.id,
                  status: category.status,
                }))}
              />
              <ImageForm
                initialData={post}
                rootId={post.rootId}
                postId={post.id}
              />
              <ContentForm
                initialData={post}
                rootId={post.rootId}
                postId={post.id}
              />
              <SlugForm
                initialData={post}
                placeholder="how-to-write-a-screenplay"
                apiUrl={`/api/posts/${post.rootId}`}
              />
              <TagForm
                initialData={post}
                rootId={post.rootId}
                postId={post.id}
                options={tags.map((tag) => ({
                  label: tag.title,
                  value: tag.id,
                  status: tag.status,
                }))}
              />
            </TabsContent>
            <TabsContent value="seo">
              <SeoEditView
                initialData={post.seo}
                contentType={SeoContentTypeApi.Post}
                contentRootId={post.rootId}
                contentId={post.id}
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={!isComplete}
            contentType={SeoContentTypeApi.Post}
            contentRootId={post.rootId}
            contentId={post.id}
            status={post.status}
            lastSavedAt={post.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default PostIdPage;
