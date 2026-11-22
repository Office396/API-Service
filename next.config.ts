import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The dev server trusts localhost and the hostname it was started with. Opening the
  // printed 127.0.0.1 URL would otherwise load HTML without ever hydrating.
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return [{ source: "/v1/:slug", destination: "/api/v1/:slug" }];
  },
  turbopack: {
    rules: {
      // Only the Tailwind entry needs this loader. Treating .module.css as plain
      // CSS strips the class-name exports used by the homepage and playground.
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
