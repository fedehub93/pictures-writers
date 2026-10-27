"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

import {
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
} from "../lib/parse-youtube-url";

type Props = {
  src: string;
  start?: number | string;
};

export const YouTubeFacade = ({ src, start }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoId = getYouTubeVideoId(src);
  const embedUrl = getYouTubeEmbedUrl(src, start);

  if (!videoId || !embedUrl) {
    return (
      <iframe
        src={src}
        allowFullScreen
        className="not-prose h-full w-full aspect-video"
      />
    );
  }

  if (isPlaying) {
    return (
      <div className="not-prose w-full aspect-video">
        <iframe
          src={embedUrl}
          title="Video YouTube"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      aria-label="Riproduci video"
      className="not-prose group relative block w-full aspect-video overflow-hidden rounded-md bg-black"
    >
      <Image
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(max-width: 1280px) 90vw, 40vw"
        unoptimized
        className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-black/70 text-white transition-transform group-hover:scale-110">
          <Play className="size-7 fill-current" />
        </span>
      </span>
    </button>
  );
};
