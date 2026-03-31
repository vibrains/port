import type { NextConfig } from "next";
import path from "path";

const BASE_PATH = "/timekit";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: BASE_PATH,
  turbopack: {
    root: "../../",
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@radix-ui/react-select",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
      "@radix-ui/react-dialog",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-label",
      "@radix-ui/react-switch",
    ],
  },
};

export default nextConfig;
