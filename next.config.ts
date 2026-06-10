import type { NextConfig } from "next";

// Parchea localStorage para Node 25 que lo expone sin contexto válido
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
};

export default nextConfig;