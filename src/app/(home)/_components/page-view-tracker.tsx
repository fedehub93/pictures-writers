"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendGTMEvent } from "@next/third-parties/google";

/**
 * Emits a single `page_view` dataLayer event on the initial load and on every
 * client-side navigation. GTM uses this event for GA4 and Meta page views so
 * App Router navigations are counted without relying on `All Pages` or
 * `History Change`.
 */
export const PageViewTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    if (lastPath.current === pagePath) return;
    lastPath.current = pagePath;

    sendGTMEvent({
      event: "page_view",
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
};
