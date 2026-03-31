import type { NextConfig } from "next";

const BASE_PATH = "/memorykit";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@ndos/ui"],
  basePath: BASE_PATH,
  turbopack: {
    root: "../../",
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
};

export default nextConfig;
