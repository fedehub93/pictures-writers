/* eslint-disable react/require-default-props */
import React, { FC } from "react";
import { Media } from "@prisma/client";
import { BlogPosting, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface BlogPostingJsonLdProps {
  url: string;
  headline?: string | string[];
  title?: string;
  keywords?: string | string[];
  imageCover: Media | null;
  images: string[];
  videos?: string[];
  datePublished: string;
  dateCreated?: string;
  dateModified?: string;
  authorName: string;
  authorType?: "Person" | "Organization";
  description: string;
  body?: string;
}

export const BlogPostingJsonLd: FC<BlogPostingJsonLdProps> = ({
  url,
  headline,
  title,
  imageCover,
  images = [],
  videos = undefined,
  datePublished,
  dateCreated,
  dateModified,
  authorName,
  authorType = "Person",
  description,
  body,
  keywords,
}) => {
  const trailingUrl = `${url}/`;
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
    thumbnailUrl: imageCover ? imageCover.url : undefined,
    image: [...images],
    genre: "Cinema, Sceneggiatura",
    //@ts-ignore
    video: videos && videos.length > 0 ? [...videos] : undefined,
    author: {
      "@type": authorType,
      name: authorName,
      url: "https://pictureswriters.com/about",
    },
    editor: authorName,
    publisher: {
      "@type": "Organization",
      name: "Pictures Writers",
      logo: {
        "@type": "ImageObject",
        url: "https://pictureswriters.com/logo.png",
      },
    },
    isPartOf: {
      "@type": "WebPage",
      "@id": trailingUrl,
      url: trailingUrl,
      name: title,
      thumbnailUrl: imageCover ? imageCover.url : undefined,
      datePublished,
      dateModified,
      description,
      inLanguage: "it-IT",
      primaryImageOfPage: imageCover
        ? {
            "@type": "ImageObject",
            "@id": `${trailingUrl}#primaryimage`,
            inLanguage: "it-IT",
            url: imageCover.url,
            contentUrl: imageCover.url,
          }
        : undefined,
    },
    datePublished: datePublished,
    dateModified: dateModified,
  };

  return <JsonLd json={json} />;
};
