/**
 * Centralized API Configuration
 *
 * Supports both Next.js (process.env.NEXT_PUBLIC_API_URL)
 * and Vite / React (import.meta.env.VITE_API_URL / process.env.VITE_API_URL)
 * conventions, ensuring the production API base URL resolves to:
 * https://api.emistore.in
 */

function resolveApiBaseUrl(): string {
  // 1. Next.js public environment variable (client and server)
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // 2. Process env VITE_API_URL (injected via next.config.mjs env)
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL
  }

  // 3. Vite ESM import.meta.env support
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env
    if (metaEnv) {
      const viteUrl = metaEnv.VITE_API_URL || metaEnv.NEXT_PUBLIC_API_URL
      if (viteUrl) return viteUrl
    }
  } catch {
    // Ignore in non-ESM environments
  }

  // 4. Default fallback to production backend
  return 'https://api.emistore.in'
}

export const API_URL = resolveApiBaseUrl().replace(/\/+$/, '')
export const API_BASE_URL = API_URL

/**
 * Centralized fetch helper for backend API endpoints
 * Preserves route paths and prefixes with API_BASE_URL.
 */
export async function apiFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  return fetch(url, init)
}

export default API_URL
