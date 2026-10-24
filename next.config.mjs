import path from "path";
import withBundleAnalyzer from "@next/bundle-analyzer";

import {
  MEDIA_DEVICE_SIZES,
  MEDIA_IMAGE_SIZES,
  MEDIA_IMAGE_QUALITIES,
  UPLOADTHING_FILE_ORIGIN,
  UPLOADTHING_FILE_PATH,
} from "./src/modules/media/lib/image-ladder.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/assets/:id",
        destination: `${UPLOADTHING_FILE_ORIGIN}${UPLOADTHING_FILE_PATH}:id`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sitemap-0.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
      {
        source: "/ebooks/:path*",
        destination: "/shop/ebooks/:path*",
        permanent: true,
      },
      {
        source: "/concorso-tre-colori-2025/",
        destination: "/concorso-tre-colori-2026/",
        permanent: true,
      },
    ];
  },
  images: {
    // Media is delivered from the storage provider's CDN by a pure loader: no
    // `/_next/image` route, no remote patterns and no on-VPS resizing. The
    // ladder is shared with the media processor so the loader only ever asks
    // for widths that exist.
    loader: "custom",
    loaderFile: "./src/modules/media/lib/image-loader.ts",
    deviceSizes: [...MEDIA_DEVICE_SIZES],
    imageSizes: [...MEDIA_IMAGE_SIZES],
    qualities: [...MEDIA_IMAGE_QUALITIES],
  },
  trailingSlash: true,
  typedRoutes: true,
  turbopack: {
    resolveAlias: {
      handlebars: "handlebars/dist/handlebars.js",
    },
  },
  webpack: (config) => {
    config.resolve.alias["handlebars"] = path.resolve(
      "./node_modules/handlebars/dist/handlebars.js",
    );
    return config;
  },
  /* the problem is not with the prisma application or configuration, but with nextjs 16 ignoring the Prisma binary file ( .so.node) excluded from the deployment package, which causes errors at runtime. https://community.vercel.com/t/prisma-client-integration-issue-in-next-js-16/26262 */
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*"],
    "/*": ["./node_modules/.prisma/client/**/*"],
  },
  reactCompiler: true,
  allowedDevOrigins: ["127.0.0.1"],
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(nextConfig);
