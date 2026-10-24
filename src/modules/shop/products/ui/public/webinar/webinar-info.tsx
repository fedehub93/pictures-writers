import Image from "next/image";

import { TipTapRendererV2 } from "@/shared/components/tiptap-renderer";

import { getMediaBlurDataURL } from "@/modules/media/lib/media-metadata";

interface WebinarInfoProps {
  title: string;
  imageCover: {
    url: string;
    altText: string | null;
    metadata: PrismaJson.MediaMetadata;
  } | null;
  tiptapDescription: PrismaJson.TipTapBodyData | null;
}

export const WebinarInfo = ({
  title,
  imageCover,
  tiptapDescription,
}: WebinarInfoProps) => {
  const blurDataURL = getMediaBlurDataURL(imageCover);

  return (
    <div className="flex flex-col space-y-4">
      <div className="w-full relative aspect-video rounded overflow-hidden">
        {imageCover ? (
          <Image
            src={imageCover.url}
            alt={imageCover.altText || ""}
            fill
            sizes="(max-width:1280px) 90vw, 40vw"
            preload
            className="blog-post__image"
            {...(blurDataURL
              ? {
                  placeholder: "blur",
                  blurDataURL,
                }
              : {})}
          />
        ) : null}
      </div>
      <h1 className="text-4xl font-bold">{title}</h1>
      {tiptapDescription && <TipTapRendererV2 content={tiptapDescription} />}
    </div>
  );
};
