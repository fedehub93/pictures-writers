import path from "path";
import withBundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
  images: {
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "ghhc7ejbae.ufs.sh",
        pathname: "/f/*",
      },
    ],
    qualities: [50, 75, 100],
    formats: ["image/webp"],
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
      "./node_modules/handlebars/dist/handlebars.js"
    );
    return config;
  },
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(nextConfig);
