import type { NextConfig } from "next";

if (typeof globalThis.localStorage !== "undefined") {
  try {
    globalThis.localStorage.getItem("__test__");
  } catch {
    // @ts-ignore
    delete globalThis.localStorage;
    // @ts-ignore
    delete globalThis.sessionStorage;
  }
}

const nextConfig: NextConfig = {
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;