import Link from "next/link";
import { EyeIcon, EyeOffIcon, Loader2Icon, SaveIcon } from "lucide-react";

import { ContentStatus } from "@/generated/prisma";

import { Button } from "@/shared/ui/button";
import { createUsePuck, Data } from "@puckeditor/core";

import { config, HydratedComponents } from "./config";

const usePuck = createUsePuck<typeof config>();

interface HeaderActionsProps {
  id: string;
  rootId: string;
  initialData: {
    title: string;
    slug: string;
    status: ContentStatus;
    puckData: Data<HydratedComponents>;
  };
  isSaving: boolean;
  isPublishing: boolean;
  onSave: (data: Data<HydratedComponents>) => void;
  onPublish: (id: string, rootId: string) => void;
}

export const HeaderActions = ({
  id,
  rootId,
  initialData,
  isSaving,
  isPublishing,
  onSave,
  onPublish,
}: HeaderActionsProps) => {
  const appState = usePuck((s) => s.appState);

  return (
    <>
      <div className="flex items-center gap-2">
        <>
          <Button type="button" variant="ghost" asChild>
            <Link href={`/draft/${initialData.slug}`} target="_blank">
              <EyeIcon className="size-4" />
              Preview
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            disabled={isSaving || isPublishing}
            onClick={() => onSave(appState.data)}
          >
            {isSaving && <Loader2Icon className="size-4 animate-spin" />}
            {!isSaving && <SaveIcon className="size-4" />}
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving || isPublishing}
            onClick={() => onPublish(id, rootId)}
          >
            {initialData.status !== ContentStatus.PUBLISHED && (
              <>
                {isPublishing && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {!isPublishing && <EyeIcon className="size-4" />}
                Publish
              </>
            )}
            {initialData.status === ContentStatus.PUBLISHED && (
              <>
                {isPublishing && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                {!isPublishing && <EyeOffIcon className="size-4" />}
                Unpublish
              </>
            )}
          </Button>
        </>
      </div>
    </>
  );
};
