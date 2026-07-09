import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep local demos/screenshots clean (production has no dev indicator anyway).
  devIndicators: false,
  // Note: the /api/* proxy to docs-api is a runtime Route Handler
  // (app/api/[...path]/route.ts), not a next.config rewrite, so the API URL
  // (API_PROXY_ORIGIN) is read at request time with no build-time coupling.
};

export default nextConfig;
