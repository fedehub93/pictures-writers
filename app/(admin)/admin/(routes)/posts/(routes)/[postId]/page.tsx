import { redirectToSignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { TitleForm } from "./_components/title-form";
import { SlugForm } from "./_components/slug-form";
import { ContentForm } from "./_components/content-form";
import { StatusView } from "./_components/status-view";

const PostIdPage = async ({ params }: { params: { postId: string } }) => {
  const userAdmin = await authAdmin();
  if (!userAdmin) {
    return redirectToSignIn();
  }

  const post = await db.post.findUnique({
    where: {
      id: params.postId,
    },
  });

  if (!post) {
    redirect("/admin/posts");
  }

  return (
    <div className="p-6 max-w-7xl mx-auto ">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Post setup</h1>
      </div>
      <div className=" grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 py-8">
        <div className="col-span-full md:col-span-4 lg:col-span-9 flex flex-col gap-y-4">
          <TitleForm initialData={post} postId={post.id} />
          <ContentForm initialData={post} postId={post.id} />
          <SlugForm initialData={post} postId={post.id} />
        </div>
        <div className="col-span-full md:col-span-2 lg:col-span-3 dark:bg-slate-900">
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
