// API configuration and utility functions

// Prefer env (set by start_web.py → web/.env.local). Fallback keeps the app usable when
// .env.local is missing (avoids hard crash / "server error" on first load).
const DEFAULT_DEV_API = "http://localhost:8001";

function resolveApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return DEFAULT_DEV_API;
  }
  if (typeof window !== "undefined") {
    console.warn(
      "[api] NEXT_PUBLIC_API_BASE is not set; using",
      DEFAULT_DEV_API,
      "— set NEXT_PUBLIC_API_BASE for production.",
    );
    return DEFAULT_DEV_API;
  }
  return DEFAULT_DEV_API;
}

export const API_BASE_URL = resolveApiBase();

/**
 * Construct a full API URL from a path
 * @param path - API path (e.g., '/api/v1/knowledge/list')
 * @returns Full URL (e.g., 'http://localhost:8000/api/v1/knowledge/list')
 */
export function apiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Remove trailing slash from base URL if present
  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  return `${base}${normalizedPath}`;
}

/**
 * Construct a WebSocket URL from a path
 * @param path - WebSocket path (e.g., '/api/v1/solve')
 * @returns WebSocket URL (e.g., 'ws://localhost:{backend_port}/api/v1/solve')
 * Note: backend_port is configured in config/main.yaml
 */
export function wsUrl(path: string): string {
  // Security Hardening: Convert http to ws and https to wss.
  // In production environments (where API_BASE_URL starts with https), this ensures secure websockets.
  const base = API_BASE_URL.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

  // Remove leading slash if present to avoid double slashes
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Remove trailing slash from base URL if present
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;

  return `${normalizedBase}${normalizedPath}`;
}
