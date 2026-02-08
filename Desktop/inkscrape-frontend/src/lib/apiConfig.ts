// Central API configuration - single source of truth for API base URL

const DEFAULT_API_BASE_URL = 'https://inkscape-api.duckdns.org';

/**
 * Resolved API base URL from environment variable or default.
 * Use this throughout the app instead of hardcoding URLs.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || DEFAULT_API_BASE_URL;

/**
 * Get the full URL for an API endpoint
 */
export function getApiUrl(endpoint: string): string {
  const base = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
