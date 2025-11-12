import Image from "next/image";

import { Separator } from "@/components/ui/separator";

import { TipTapRendererV2 } from "@/components/tiptap-renderer";

import { getPlaceholderImage } from "@/lib/image";

interface WebinarInfoProps {
  title: string;
  imageCover: { url: string; altText: string | null } | null;
  tiptapDescription: PrismaJson.TipTapBodyData | null;
}

export const WebinarInfo = async ({
  title,
  imageCover,
  tiptapDescription,
}: WebinarInfoProps) => {
  const imageWithPlaceholder = await getPlaceholderImage(imageCover?.url!);

  return (
    <div className="flex flex-col space-y-4">
      <div className="w-full relative aspect-video rounded overflow-hidden">
        {imageCover ? (
          <Image
            src={imageCover.url}
            alt={imageCover.altText || ""}
            fill
            sizes="(max-width:1280px) 90vw, 40vw"
            priority
            className="blog-post__image"
            placeholder="blur"
            blurDataURL={imageWithPlaceholder.placeholder}
          />
        ) : null}
      </div>
      <Separator />
      <h1 className="text-4xl font-bold">{title}</h1>
      {tiptapDescription && <TipTapRendererV2 content={tiptapDescription} />}
    </div>
  );
};
