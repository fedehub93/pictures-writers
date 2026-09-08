import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Scope of content revalidation.
 *
 * Each scope revalidates the surfaces that depend on the changed content,
 * so edits propagate instantly without a full application rebuild.
 *
 * See ADR-0001 (docs/adr/0001-on-demand-revalidation.md) for the rationale
 * behind route-level invalidation and the ISR backstop strategy.
 */
export type RevalidateScope =
  | "post"
  | "page"
  | "product"
  | "settings"
  | "all";

/**
 * Revalidate the public surfaces affected by a content change.
 *
 * @param scope - The kind of content that changed. Determines which surfaces
 *   are revalidated.
 * @param slug - The URL path of the specific content item (e.g. `"blog/mio-post"`,
 *   `"shop/ebooks/mio-ebook"`). When provided, the item's own page is revalidated
 *   in addition to the aggregate surfaces for the scope.
 *
 * Surfaces revalidated per scope:
 * - **post**: the post page + `/blog` segment (listing, pagination, categories, tags) + home (`LatestNews`) + sitemap
 * - **page**: the Puck page + sitemap
 * - **product**: the `/shop` segment (listing, categories, and every product page
 *   at `/shop/{categorySlug}/{productSlug}`) + sitemap. No slug is needed for
 *   products: revalidating the `/shop` layout covers all product pages, and a
 *   bare `product.slug` would not match the two-segment URL.
 * - **settings**: root layout (navbar/footer) + sitemap — settings affect the whole site
 * - **all**: root layout + sitemap — emergency "revalidate everything" (replaces the old webhook build)
 */
export function revalidateContent(
  scope: RevalidateScope,
  slug?: string,
): void {
  // Revalidate the specific content page if a slug is provided
  if (slug) {
    const normalizedSlug = slug.startsWith("/") ? slug : `/${slug}`;
    revalidatePath(normalizedSlug);
  }

  switch (scope) {
    case "post":
      // Blog listing, pagination, categories, and tags
      revalidatePath("/blog", "layout");
      // Home page (LatestNews component reads from DB)
      revalidatePath("/");
      // Sitemap
      revalidatePath("/sitemap.xml");
      break;

    case "page":
      // Puck pages don't affect listings, but sitemap may include them
      revalidatePath("/sitemap.xml");
      break;

    case "product":
      // Shop listing and categories
      revalidatePath("/shop", "layout");
      // Sitemap
      revalidatePath("/sitemap.xml");
      break;

    case "settings":
    case "all":
      // Settings affect navbar/footer globally; "all" is the emergency fallback
      // that replaces the old triggerWebhookBuild() full rebuild
      revalidatePath("/", "layout");
      revalidatePath("/sitemap.xml");
      break;
  }
}
