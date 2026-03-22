const DEFAULT_LOCAL_API = "http://127.0.0.1:8000/api";

// Centralized API base resolver so we don't hardcode localhost in multiple places.
// Priority: explicit env var -> same origin (for Cloudflare/proxy/tunnel setups) -> local dev default.
export const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  return DEFAULT_LOCAL_API;
};

export const API_BASE = getApiBase();
