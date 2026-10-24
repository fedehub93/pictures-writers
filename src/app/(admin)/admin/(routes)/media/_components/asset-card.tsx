"use client";

import { useState } from "react";
import Image from "next/image";
import { MediaType } from "@/generated/prisma";

import { Checkbox } from "@/shared/ui/checkbox";
import { Badge } from "@/shared/ui/badge";
import { formatBytes } from "@/lib/format";
import { File } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import {
  formatMediaDimensions,
  type MediaLibraryItem,
} from "@/modules/media/lib/media-library";

interface AssetCardProps {
  media: MediaLibraryItem;
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
  const { onOpen } = useModal();

  const { id, name, altText, url, type, size, mimeType, checksum, revision } =
    media;
  const dimensions = formatMediaDimensions(media);

  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onCheckboxChange(id, checked);
  };

  const onHandleEdit = () => {
    onOpen("editMediaAsset", undefined, { id, name, altText: altText || "" });
  };

  return (
    <div className="relative group hover:shadow-2xs transition overflow-hidden border rounded-lg h-full">
      <div className="absolute p-4 z-10 w-full flex items-center justify-between">
        <Checkbox checked={isChecked} onCheckedChange={handleCheckboxChange} />
        <Button variant="outline" size="sm" onClick={onHandleEdit}>
          Edit
        </Button>
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
          <Badge>{type}</Badge>
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
      </div>
    </div>
  );
};
