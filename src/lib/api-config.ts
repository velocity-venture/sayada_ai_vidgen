/**
 * Global API Configuration for Vidgen Zone
 * Removed base path to support root-level routing
 */

/**
 * Returns the full API URL (no base path prefix)
 * @param endpoint - The API endpoint (e.g., '/api/profile')
 * @returns Full URL (e.g., '/api/profile')
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return cleanEndpoint;
}

/**
 * Wrapper around fetch that uses clean root-level paths
 * @param endpoint - The API endpoint
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export async function apiFetch(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
}

/**
 * Helper for making GET requests
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await apiFetch(endpoint, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Helper for making POST requests
 */
export async function apiPost<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Helper for making PUT requests
 */
export async function apiPut<T>(
  endpoint: string,
  data?: any
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Helper for making DELETE requests
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await apiFetch(endpoint, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
}

export default {
  getApiUrl,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
};