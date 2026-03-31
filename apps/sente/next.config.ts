import type { NextConfig } from "next";

const BASE_PATH = "/sente";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: BASE_PATH,
  turbopack: {
    root: "../../",
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
