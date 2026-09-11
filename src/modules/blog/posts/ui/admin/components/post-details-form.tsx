"use client";

import type { Editor as TiptapEditor } from "@tiptap/core";

import { ContentStatus, type User } from "@/generated/prisma";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

import { ContentForm } from "./content-form";

interface PostDetailsFormProps {
  id: string;
  rootId: string;
  initialData: {
    id: string;
    status: ContentStatus;
    title: string;
    description: string | null;
    slug: string;
    postAuthors: {
      user: User;
      sort: number;
    }[];
    postCategories: {
      category: {
        id: string;
        title: string;
      };
      sort: number;
    }[];
    tiptapBodyData: any;
  } | null;
  onEditorReady?: (editor: TiptapEditor | null) => void;
}

export const PostDetailsForm = ({
  id,
  rootId,
  initialData,
  onEditorReady,
}: PostDetailsFormProps) => {
  if (!initialData) return <div>Error...</div>;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="px-4 py-4 md:px-6 flex justify-between items-center flex-row">
        <CardTitle className="w-full text-xl font-normal text-foreground mb-0">
          {initialData.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 mt-0">
        <ContentForm
          postId={id}
          rootId={rootId}
          initialData={initialData}
          onEditorReady={onEditorReady}
        />
      </CardContent>
    </Card>
  );
};
