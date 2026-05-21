import type { ApiResponse } from '@/types';

// ============================
// Auth Token Helpers
// ============================

const TOKEN_STORAGE_KEY = 'pos_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * Build the Authorization header value from the stored token.
 * Returns undefined if no token is available.
 */
function buildAuthHeader(): Record<string, string> | undefined {
  const token = getStoredToken();
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
}

// ============================
// Core API Fetch
// ============================

/**
 * Wrapper around `fetch` that:
 * - Prepends no base URL (uses relative paths for Next.js API routes)
 * - Automatically injects the Authorization header from localStorage
 * - Sets JSON content-type for POST/PUT/PATCH requests
 * - Parses the JSON response
 * - Normalizes error responses into `ApiResponse<T>` shape
 */
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const method = (options.method || 'GET').toUpperCase();

  // Merge headers
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
    ...(buildAuthHeader() ?? {}),
  };

  // Set Content-Type for requests with a body
  if (
    ['POST', 'PUT', 'PATCH'].includes(method) &&
    !headers['Content-Type']
  ) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse the response body
    let data: unknown;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // Non-JSON response – treat as text
      data = await response.text();
    }

    // Successful response
    if (response.ok) {
      return data as ApiResponse<T>;
    }

    // Server returned an error – the response body may already follow ApiResponse shape
    const apiResponse = data as ApiResponse<T>;
    return {
      success: false,
      error:
        apiResponse.error ||
        `خطأ في الخادم: ${response.status} ${response.statusText}`,
      data: apiResponse.data,
    };
  } catch (error) {
    // Network error or JSON parse error
    const message =
      error instanceof Error ? error.message : 'خطأ في الاتصال بالخادم';
    return {
      success: false,
      error: message,
    };
  }
}

// ============================
// Convenience Methods
// ============================

/**
 * Perform a GET request.
 */
export function apiGet<T>(
  url: string,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { ...options, method: 'GET' });
}

/**
 * Perform a POST request with a JSON body.
 */
export function apiPost<T>(
  url: string,
  body?: unknown,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Perform a PUT request with a JSON body.
 */
export function apiPut<T>(
  url: string,
  body?: unknown,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * Perform a DELETE request.
 */
export function apiDelete<T>(
  url: string,
  options?: Omit<RequestInit, 'method' | 'body'>
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' });
}
