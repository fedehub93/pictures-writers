import path from "path";
// import withBundleAnalyzer from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/sitemap-0.xml",
        destination: "/sitemap.xml",
        permanent: true,
      },
    ];
  },
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  webpack: (config) => {
    config.resolve.alias["handlebars"] = path.resolve(
      "./node_modules/handlebars/dist/handlebars.js"
    );
    return config;
  },
};

export default nextConfig;

// const bundleAnalyzer = withBundleAnalyzer({
//   enabled: process.env.ANALYZE === "true",
// });

// export default bundleAnalyzer(nextConfig);
