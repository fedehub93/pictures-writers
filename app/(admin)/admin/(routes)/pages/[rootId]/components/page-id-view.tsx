"use client";

import axios from "axios";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentStatus } from "@/generated/prisma";

import { PuckEditor } from "@/puck/config";
import { PageUpdateValues } from "../../schema";
import { GetLastPageByRootId } from "../../data";

export const PageIdView = ({
  pageId,
  initialData,
}: {
  pageId: string;
  initialData: NonNullable<GetLastPageByRootId>;
}) => {
  const router = useRouter();

  const onSave = async (values: PageUpdateValues) => {
    if (initialData.status === ContentStatus.PUBLISHED) {
      try {
        await axios.post(
          `/api/admin/pages/${initialData.rootId}/versions`,
          values,
        );
        toast.success(`Page updated`);
      } catch {
        toast.error("Something went wrong");
      } finally {
        router.refresh();
      }

      return;
    }

    try {
      await axios.patch(
        `/api/admin/pages/${initialData.rootId}/versions/${pageId}`,
        values,
      );
      toast.success(`Page updated`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
    }
  };

  return (
    <>
      <Tabs defaultValue="editor" className="pt-1 mb-0">
        <TabsList className="rounded-t-lg rounded-b-none h-10 [&>button]:bg-transparent [&>button]:h-full [&>button]:text-sm [&>button]:flex [&>button]:gap-x-2 overflow-hidden p-0 border border-b-0">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="mt-0 border">
          <PuckEditor
            id={pageId}
            initialData={initialData.puckData ?? { root: {}, content: [] }}
            onSavePage={onSave}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};
