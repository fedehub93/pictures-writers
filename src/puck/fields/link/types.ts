/**
 * Link targets understood by the Link block and the other Puck blocks that
 * reference CMS entities (LinkList, NavbarBlock).
 *
 * A `SmartLink` is stored as-is in the Puck document and resolved server-side
 * when the document is rendered, so moving or renaming an entity does not
 * require editing every page or region that links to it.
 */
export const SMART_LINK_TYPES = [
  "external",
  "page",
  "post",
  "product",
  "category",
  "productCategory",
] as const;

export type SmartLinkType = (typeof SMART_LINK_TYPES)[number];

export type SmartLink =
  | { type: "external"; url: string; openInNewTab?: boolean }
  | { type: "page"; pageId: string }
  | { type: "post"; postId: string }
  | { type: "product"; productId: string }
  | { type: "category"; categoryId: string }
  | { type: "productCategory"; productCategoryId: string };

/**
 * The Link block stores the target together with its visible label.
 */
export type LinkProps = SmartLink & { label?: string };

/**
 * One row of an editable list of links (LinkList, Copyright).
 *
 * The link is nested so an array field can hold a single SmartLink editor per
 * row; the server-side resolver walks into it like any other value.
 */
export type LinkListItem = { link?: LinkProps | LegacyLinkProps };

/**
 * Shape written by Link blocks before the SmartLink model existed.
 *
 * It is still accepted at runtime so published documents do not break.
 */
export interface LegacyLinkProps {
  label?: string;
  href?: string;
  openInNewTab?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Runtime guard used by the server-side document walker. It checks the field
 * required by each target type, so a malformed prop is left untouched instead
 * of being replaced with an empty link.
 */
export function isSmartLink(value: unknown): value is SmartLink {
  if (!isRecord(value) || typeof value.type !== "string") return false;

  switch (value.type) {
    case "external":
      return typeof value.url === "string";
    case "page":
      return typeof value.pageId === "string";
    case "post":
      return typeof value.postId === "string";
    case "product":
      return typeof value.productId === "string";
    case "category":
      return typeof value.categoryId === "string";
    case "productCategory":
      return typeof value.productCategoryId === "string";
    default:
      return false;
  }
}

/**
 * Convert an old `{ label, href }` link, or a link that has already been
 * resolved to `{ label, href }`, to the SmartLink model.
 *
 * Returns `undefined` when the value does not describe a link.
 */
export function normalizeLinkProps(
  link: LinkProps | LegacyLinkProps | null | undefined,
): LinkProps | undefined {
  if (!link) return undefined;
  if (isSmartLink(link)) return link;

  if (typeof link.href === "string") {
    return {
      type: "external",
      url: link.href,
      label: link.label,
      openInNewTab: link.openInNewTab,
    };
  }

  return undefined;
}

/**
 * Return the URL stored in the link, if it can be rendered as an anchor.
 *
 * Entity links return `undefined` before server-side resolution, and broken
 * entity links keep returning `undefined` after resolution: both render as
 * plain text.
 */
export function getLinkHref(
  link: LinkProps | LegacyLinkProps | undefined,
): string | undefined {
  if (!link) return undefined;
  if (isSmartLink(link)) {
    if (link.type !== "external") return undefined;

    const url = link.url.trim();
    return url.length > 0 ? url : undefined;
  }

  const href = link.href?.trim();
  return href ? href : undefined;
}

export function getLinkOpenInNewTab(
  link: LinkProps | LegacyLinkProps | undefined,
): boolean {
  if (!link) return false;
  if (isSmartLink(link)) {
    return link.type === "external" && link.openInNewTab === true;
  }

  return (link as LegacyLinkProps).openInNewTab === true;
}

export function getSmartLinkType(
  link: LinkProps | LegacyLinkProps | undefined,
): SmartLinkType {
  return link && isSmartLink(link) ? link.type : "external";
}

/** The CMS root id (or category id) selected for an entity link. */
export function getSmartLinkEntityId(link: LinkProps): string | undefined {
  switch (link.type) {
    case "external":
      return undefined;
    case "page":
      return link.pageId;
    case "post":
      return link.postId;
    case "product":
      return link.productId;
    case "category":
      return link.categoryId;
    case "productCategory":
      return link.productCategoryId;
  }
}

/** Build an empty link of the requested type, preserving the label. */
export function createSmartLink(type: SmartLinkType): LinkProps {
  switch (type) {
    case "external":
      return { type: "external", url: "" };
    case "page":
      return { type: "page", pageId: "" };
    case "post":
      return { type: "post", postId: "" };
    case "product":
      return { type: "product", productId: "" };
    case "category":
      return { type: "category", categoryId: "" };
    case "productCategory":
      return { type: "productCategory", productCategoryId: "" };
  }
}

/** Switch target type while keeping the visible label. */
export function withSmartLinkType(
  link: LinkProps,
  type: SmartLinkType,
): LinkProps {
  return { ...createSmartLink(type), label: link.label } as LinkProps;
}

/** Replace the target of the current link type. */
export function withSmartLinkTarget(
  link: LinkProps,
  target: string,
): LinkProps {
  switch (link.type) {
    case "external":
      return { ...link, url: target };
    case "page":
      return { ...link, pageId: target };
    case "post":
      return { ...link, postId: target };
    case "product":
      return { ...link, productId: target };
    case "category":
      return { ...link, categoryId: target };
    case "productCategory":
      return { ...link, productCategoryId: target };
  }
}

export function withLinkLabel(
  link: LinkProps,
  label: string | undefined,
): LinkProps {
  return { ...link, label } as LinkProps;
}
