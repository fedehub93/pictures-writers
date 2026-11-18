import React, { FC } from "react";
import { User } from "@/generated/prisma";
import { BlogPosting, WithContext } from "schema-dts";
import { absoluteMediaUrl } from "@/modules/media/server/media-url";
import { JsonLd } from "./json-ld";

export interface BlogPostingJsonLdProps {
  url: string;
  siteUrl: string;
  headline?: string | string[];
  title?: string;
  keywords?: string | string[];
  imageCover: { url: string } | null;
  images: string[];
  videos?: string[];
  datePublished?: string;
  dateCreated?: string;
  dateModified?: string;
  authors: User[];
  description: string;
  body?: string;
}

export const BlogPostingJsonLd: FC<BlogPostingJsonLdProps> = ({
  url,
  siteUrl,
  headline,
  title,
  imageCover,
  images = [],
  videos = undefined,
  datePublished,
  dateCreated,
  dateModified,
  authors,
  description,
  body,
  keywords,
}) => {
  const trailingUrl = `${url}/`;
  const coverUrl = imageCover
    ? absoluteMediaUrl(imageCover.url, siteUrl)
    : undefined;
  const json: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${trailingUrl}#blog-posting`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": trailingUrl,
    },
    headline: title,
    description: description,
    thumbnailUrl: coverUrl,
    image: images.map((src) => absoluteMediaUrl(src, siteUrl)),
    genre: "Cinema, Sceneggiatura",
    video:
      videos && videos.length > 0
        ? videos.map((videoUrl) => ({
            "@type": "VideoObject",
            name: title,
            description: description,
            thumbnailUrl: coverUrl,
            uploadDate: datePublished,
            contentUrl: videoUrl,
            embedUrl: videoUrl,
          }))
        : undefined,
    author: authors.map((a) => ({
      "@type": "Person",
      name: `${a.firstName} ${a.lastName}`,
      url: `${siteUrl}/about/`,
    })),
    editor: authors.map((a) => ({
      "@type": "Person",
      name: `${a.firstName} ${a.lastName}`,
      url: `${siteUrl}/about/`,
    })),
    publisher: {
      "@type": "Organization",
      name: "Pictures Writers",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    isPartOf: {
      "@type": "WebPage",
      "@id": trailingUrl,
      url: trailingUrl,
      name: title,
      thumbnailUrl: coverUrl,
      datePublished,
      dateModified,
      description,
      inLanguage: "it-IT",
      primaryImageOfPage: imageCover
        ? {
            "@type": "ImageObject",
            "@id": `${trailingUrl}#primaryimage`,
            inLanguage: "it-IT",
            url: coverUrl,
            contentUrl: coverUrl,
          }
        : undefined,
    },
    datePublished: datePublished,
    dateModified: dateModified,
  };

  return <JsonLd json={json} />;
};
