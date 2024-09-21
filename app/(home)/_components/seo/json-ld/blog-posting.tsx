/* eslint-disable react/require-default-props */
import React, { FC } from "react";
import { BlogPosting, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface BlogPostingJsonLdProps {
  url: string;
  headline?: string | string[];
  title?: string;
  keywords?: string | string[];
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
  const json: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: title,
    description: description,
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
    datePublished: datePublished,
    dateModified: dateModified,
  };

  return <JsonLd json={json} />;
};