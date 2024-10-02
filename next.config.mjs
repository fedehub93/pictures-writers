import path from "path";

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
