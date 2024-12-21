import { ReactNode } from "react";
import { CustomElement } from "./components/editor";
import { Media, Product, ProductCategory, WidgetType } from "@prisma/client";

declare global {
  namespace PrismaJson {
    type BodyData = CustomElement[];
    type ProductMetadata = EbookMetadata | AffiliateMetadata | null | undefined;
    type WidgetMetadata = any;
    type Scripts = SettingsScripts[] | null | undefined;
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

/**
 * Product Types
 */

export type ProductWithImageCoverAndAuthor = Product & {
  imageCover: Media | null;
};

/**
 * Ebook types
 */

export enum EbookType {
  PDF = "pdf",
  EPUB = "epub",
  MOBI = "mobi",
}

export type EbookFormat = {
  type: EbookType;
  url: string;
  size: number;
  pages: number;
};

export type EbookMetadata = {
  type: ProductCategory;
  formats: EbookFormat[];
  edition: string;
  publishedAt: Date | null;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  } | null;
};

export type AffiliateMetadata = {
  type: ProductCategory;
  url: string;
};

/**
 * Widget types
 */

export enum WidgetPostType {
  ALL = "ALL",
  SPECIFIC = "SPECIFIC",
  POPULAR = "POPULAR",
  LATEST = "LATEST",
  CORRELATED = "CORRELATED",
}

export enum WidgetPostCategoryFilter {
  ALL = "ALL",
  CURRENT = "CURRENT",
  SPECIFIC = "SPECIFIC",
}

export type WidgetSearchMetadata = {
  label: string;
  type: WidgetType;
  isDynamic: boolean
};

export type WidgetPostMetadata = {
  label: string;
  type: WidgetType;
  postType: WidgetPostType;
  posts: string[];
  categoryType: WidgetPostCategoryFilter;
  categories: string[];
  limit: number;
};

/**
 * Script types
 */

export enum ScriptStrategy {
  beforeInteractive = "beforeInteractive",
  afterInteractive = "afterInteractive",
  lazyOnLoad = "lazyOnload",
  worker = "worker",
}

export type SettingsScripts = {
  name?: string;
  src?: string;
  strategy?: ScriptStrategy;
  content?: string;
  enabled?: boolean;
};
