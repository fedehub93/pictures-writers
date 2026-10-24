"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Archive, ArchiveRestore, File, Trash } from "lucide-react";
import { MediaType } from "@/generated/prisma";

import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import { formatBytes } from "@/lib/format";
import { Button } from "@/shared/ui/button";
import { apiErrorMessage } from "@/shared/lib/api-error";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import {
  formatMediaDimensions,
  type MediaLibraryEntry,
} from "@/modules/media/lib/media-library";

interface AssetCardProps {
  media: MediaLibraryEntry;
  onCheckboxChange: (id: string, isChecked: boolean) => void;
}

function DetailRow({
  label,
  value,
  title,
  mono = false,
}: {
  label: string;
  value: string;
  title?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-x-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-xs truncate ${mono ? "font-mono" : ""}`}
        title={title ?? value}
      >
        {value}
      </span>
    </div>
  );
}

export const AssetCard = ({ media, onCheckboxChange }: AssetCardProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { onOpen } = useModal();
  const router = useRouter();

  const {
    id,
    name,
    altText,
    url,
    type,
    size,
    mimeType,
    checksum,
    revision,
    archivedAt,
    usageCount,
  } = media;
  const dimensions = formatMediaDimensions(media);
  const isArchived = archivedAt !== null;

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onCheckboxChange(id, checked);
  };

  const onHandleEdit = () => {
    onOpen("editMediaAsset", undefined, { id, name, altText: altText || "" });
  };

  const onHandleReplace = () => {
    onOpen("replaceMediaAsset", undefined, { id, name, type });
  };

  const runAction = async (
    action: () => Promise<unknown>,
    success: string,
  ) => {
    try {
      setIsLoading(true);
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Something went wrong"));
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  const onArchive = () =>
    runAction(() => axios.post(`/api/media/${id}/archive`), "Asset archived");

  const onRestore = () =>
    runAction(() => axios.post(`/api/media/${id}/restore`), "Asset restored");

  const onDelete = () =>
    runAction(
      () => axios.delete(`/api/media/${id}`),
      "Asset deleted permanently",
    );

  const archiveDescription =
    usageCount > 0
      ? `${usageCount} content ${
          usageCount === 1 ? "item references" : "items reference"
        } this asset. Archiving keeps it served and keeps those references intact; you can restore it later. References embedded in rich text or page data are not counted.`
      : "Archived media leave the library but keep being served and referenced. You can restore them later.";

  const deleteDescription =
    usageCount > 0
      ? `This would remove the file and every rendition, but ${usageCount} content ${
          usageCount === 1 ? "item still references" : "items still reference"
        } it, so the deletion will be refused. Remove those references first. References embedded in rich text or page data are not counted.`
      : "This permanently removes the file and every generated rendition. It cannot be undone. References embedded in rich text or page data are not counted and cannot be protected.";

  return (
    <div className="relative group hover:shadow-2xs transition overflow-hidden border rounded-lg h-full">
      <div className="absolute p-4 z-10 w-full flex items-start justify-between gap-x-2">
        <Checkbox checked={isChecked} onCheckedChange={handleCheckboxChange} />
        <div className="flex flex-wrap justify-end gap-x-2 gap-y-2">
          {!isArchived ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={onHandleReplace}
              >
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={onHandleEdit}
              >
                Edit
              </Button>
              <ArchiveConfirm
                description={archiveDescription}
                disabled={isLoading}
                onConfirm={onArchive}
              />
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={onRestore}
              >
                <ArchiveRestore />
                Restore
              </Button>
              <DeleteConfirm
                description={deleteDescription}
                disabled={isLoading}
                onConfirm={onDelete}
              />
            </>
          )}
        </div>
      </div>
      <div className="relative w-full aspect-video rounded-md overflow-hidden">
        {type === MediaType.IMAGE && (
          <Image
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            alt={altText || name}
            src={url}
          />
        )}
        {type === MediaType.FILE && (
          <File className="absolute w-full h-full" strokeWidth={1} />
        )}
      </div>
      <div className="flex flex-col gap-y-2 p-3">
        <div className="flex justify-between items-center gap-x-4">
          <div className="text-sm truncate font-medium group-hover:text-sky-700 transition">
            {name}
          </div>
          <div className="flex items-center gap-x-2">
            {isArchived && <Badge variant="secondary">Archived</Badge>}
            <Badge>{type}</Badge>
          </div>
        </div>
        <DetailRow label="Size" value={formatBytes(size || 0)} />
        {dimensions && <DetailRow label="Dimensions" value={dimensions} />}
        {mimeType && <DetailRow label="MIME" value={mimeType} />}
        {checksum && (
          <DetailRow
            label="Checksum"
            value={checksum.slice(0, 12)}
            title={checksum}
            mono
          />
        )}
        {revision > 1 && <DetailRow label="Revision" value={`v${revision}`} />}
        <DetailRow
          label="Used in"
          value={`${usageCount} relational ${
            usageCount === 1 ? "reference" : "references"
          }`}
          title="References embedded in rich text or page data are not counted"
        />
      </div>
    </div>
  );
};

function ArchiveConfirm({
  description,
  disabled,
  onConfirm,
}: {
  description: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      title="Archive this asset?"
      description={description}
      confirmLabel="Archive"
      onConfirm={onConfirm}
    >
      <Button variant="outline" size="sm" disabled={disabled}>
        <Archive />
        Archive
      </Button>
    </ConfirmModal>
  );
}

function DeleteConfirm({
  description,
  disabled,
  onConfirm,
}: {
  description: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      title="Delete this asset permanently?"
      description={description}
      confirmLabel="Delete permanently"
      onConfirm={onConfirm}
    >
      <Button variant="destructive" size="sm" disabled={disabled}>
        <Trash />
        Delete
      </Button>
    </ConfirmModal>
  );
}
