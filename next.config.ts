import type { NextConfig } from "next";

// Frontend-only prototype: every screen is driven by local mock data and client state,
// so Cache Components / Partial Prefetching are intentionally left off.
const nextConfig: NextConfig = {
  // The floating "Demo" role switcher lives in the bottom-left corner.
  devIndicators: false,
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
