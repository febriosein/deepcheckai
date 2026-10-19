import type { NextConfig } from "next";

if (process.env.NODE_ENV !== "production") {
  process.env.NEXT_PRIVATE_DISABLE_DEV_OVERLAY_UX = "1";
  process.env.__NEXT_DISABLE_DEV_OVERLAY_UX = "true";
}

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
