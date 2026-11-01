/**
 * CiteCheck AI — Global API URL Resolver
 * Uses the VITE_API_URL environment variable when deployed (e.g. on Vercel),
 * and defaults to relative paths for local development proxy.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function apiUrl(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${clean}`;
}
