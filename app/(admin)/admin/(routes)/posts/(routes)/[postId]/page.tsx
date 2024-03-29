import * as z from "zod";
import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { TitleForm } from "@/components/general-fields/title-form";
import { SlugForm } from "@/components/general-fields/slug-form";

import { ContentForm } from "./_components/content-form";
import { StatusView } from "./_components/status-view";
import { ImageForm } from "./_components/image-form";
import { CategoryForm } from "./_components/category-form";
import { DescriptionForm } from "@/components/general-fields/description-form";
import { TagForm } from "./_components/tag-form";

const PostIdPage = async ({ params }: { params: { postId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const post = await db.post.findUnique({
    where: {
      id: params.postId,
    },
    include: {
      imageCover: true,
      tags: true,
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

  return (
    <div className="p-6 max-w-7xl mx-auto ">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Post setup</h1>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 py-8">
        <div className="col-span-full md:col-span-4 lg:col-span-9 flex flex-col gap-y-4">
          <TitleForm
            initialData={post}
            placeholder="e.g. How to write a screenplay"
            apiKey="posts"
            apiKeyValue={post.id}
          />
          <DescriptionForm
            initialData={post}
            placeholder="e.g. This article shows you how to write a screenplay from scratch. Learn More."
            apiKey="posts"
            apiKeyValue={post.id}
          />
          <CategoryForm
            initialData={post}
            postId={post.id}
            options={categories.map((category) => ({
              label: category.title,
              value: category.id,
            }))}
          />
          <ImageForm initialData={post} postId={post.id} />
          <ContentForm initialData={post} postId={post.id} />
          <SlugForm
            initialData={post}
            placeholder="how-to-write-a-screenplay"
            apiKey="posts"
            apiKeyValue={post.id}
          />
          <TagForm
            initialData={post}
            postId={post.id}
            options={tags.map((tag) => ({
              label: tag.title,
              value: tag.id,
            }))}
          />
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3">
          <StatusView
            disabled={false}
            postId={post.id}
            isPublished={post.isPublished}
            lastSavedAt={post.updatedAt}
          />
        </div>
      </div>
    </div>
  );
};

export default PostIdPage;
