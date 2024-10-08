import { ReactNode } from "react";
import { CustomElement } from "./components/editor";

declare global {
  namespace PrismaJson {
    type BodyData = CustomElement[];
  }
}

/**
 * @public
 */

export interface MetadataImage {
  key: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

export interface OpenGraphImages {
  url: string;
  alt?: string;
  width?: string;
  height?: string;
}

export interface OpenGraphArticle {
  publishedTime: string;
  modifiedTime: string;
  expirationTime: string;
  author: string;
  section?: string;
  tags: string[];
}

export interface OpenGraph {
  url?: string;
  type?: string;
  title?: string;
  image?: string;
  images?: OpenGraphImages[];
  description?: string;
  locale?: string;
  siteName?: string;
  article?: OpenGraphArticle;
}

export interface BaseSeoProps {
  children: ReactNode;
  language?: string;
  title?: string;
  noindex?: boolean;
  nofollow?: boolean;
  image?: string;
  url?: string;
  description?: string;
  pathname?: string;
  openGraph?: OpenGraph;
  twitterUsername?: string;
}
