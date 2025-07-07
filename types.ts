import { ReactNode } from "react";
import { CustomElement } from "./app/(admin)/_components/editor";
import {
  Contest,
  ContestTranslations,
  Media,
  Product,
  ProductType,
  Seo,
  Settings,
  SocialChannel,
  SocialKey,
  WidgetType,
} from "@prisma/client";

declare global {
  namespace PrismaJson {
    type BodyData = CustomElement[];
    type ProductMetadata =
      | EbookMetadata
      | AffiliateMetadata
      | WebinarMetadata
      | null
      | undefined;
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
  category: { title: string; slug: string } | null;
  imageCover: Media | { url: string; altText: string | null } | null;
};

export type Gallery = {
  mediaId: string;
  sort: number;
  media: Media;
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
  type: ProductType;
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
  type: ProductType;
  url: string;
};

export type WebinarMetadata = {
  type: ProductType;
  date: Date | null;
  time: string;
  seats: number;
  duration: string;
  platform: string;
};

/**
 * Contest type
 */

export interface ContestWithTranslation extends Contest {
  translation: ContestTranslations | null
}

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

export enum WidgetCategoryType {
  ALL = "ALL",
}

export enum WidgetPostCategoryFilter {
  ALL = "ALL",
  CURRENT = "CURRENT",
  SPECIFIC = "SPECIFIC",
}

export enum WidgetProductType {
  ALL = "ALL",
  SPECIFIC = "SPECIFIC",
}

export enum WidgetProductPopActionType {
  GO_TO_PRODUCT = "GO_TO_PRODUCT",
  FILL_FORM = "FILL_FORM",
}

export type WidgetProductPopMetadata = {
  label: string;
  type: WidgetType;
  autoOpenDelay: number;
  actionType: WidgetProductPopActionType;
  productRootId: null | string;
};

export type WidgetSearchMetadata = {
  label: string;
  type: WidgetType;
  isDynamic: boolean;
};

export type WidgetPostMetadataPosts = {
  rootId: string;
  sort: number;
};

export type WidgetPostMetadata = {
  label: string;
  type: WidgetType;
  postType: WidgetPostType;
  posts: WidgetPostMetadataPosts[];
  categoryFilter: WidgetPostCategoryFilter;
  categories: string[];
  limit: number;
};

export type WidgetCategoryMetadata = {
  label: string;
  type: WidgetType;
  categoryType: WidgetCategoryType;
  limit: number;
};

export type WidgetProductMetadataProducts = {
  rootId: string;
  sort: number;
};

export type WidgetProductMetadata = {
  label: string;
  type: WidgetType;
  productType: WidgetProductType;
  products: WidgetProductMetadataProducts[];
  limit: number;
};

export type WidgetNewsletterMetadata = {
  label: string;
  type: WidgetType;
};

export type WidgetAuthorMetadata = {
  label: string;
  type: WidgetType;
};

export type WidgetTagMetadata = {
  label: string;
  type: WidgetType;
};

export type WidgetSocialMetadataSocial = {
  key: SocialKey;
  isVisible: boolean;
  sort: number;
};

export type WidgetSocialMetadata = {
  label: string;
  type: WidgetType;
  socials: WidgetSocialMetadataSocial[];
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

/**
 * Settings types
 */

export type SettingsWithScriptsAndSocials = Settings & {
  seo: Seo | null;
  socials: SocialChannel[];
  siteShopUrl: string;
};
