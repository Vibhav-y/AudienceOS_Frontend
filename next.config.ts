import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next 16 removed the built-in lint step during `next build` (and the
  // `eslint` config key). Linting now runs separately via the `lint` script /
  // CI, so there's nothing to opt out of here.
};

export default nextConfig;
