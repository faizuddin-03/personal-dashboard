import type { NextConfig } from "next";
import { execSync } from "child_process";

let gitHash = "unknown";
try {
  gitHash = execSync("git rev-parse --short HEAD").toString().trim();
} catch {}

const nextConfig: NextConfig = {
  transpilePackages: ["@tiptap/extension-font-family"],
  env: {
    NEXT_PUBLIC_GIT_HASH: gitHash,
  },
};

export default nextConfig;
