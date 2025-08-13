// Robust fetch utility to handle browser extension interference and network issues
export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

export async function fetchWithFallback(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeoutMs: number,
  ): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add small delay between retries
      if (attempt > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * attempt),
        );
      }

      const response = await fetchWithTimeout(url, fetchOptions, timeout);

      // Check for successful response
      if (response.ok) {
        return response;
      }

      // Handle HTTP errors
      if (response.status >= 400) {
        throw new NetworkError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof NetworkError && error.status && error.status < 500) {
        throw error;
      }

      // Log the attempt
      console.warn(
        `Fetch attempt ${attempt + 1} failed for ${url}:`,
        error instanceof Error ? error.message : String(error),
      );

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw lastError;
      }
    }
  }

  throw lastError!;
}

export async function fetchJSON<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  try {
    const response = await fetchWithFallback(url, options);

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Don't throw error for non-JSON responses, let safeFetch handle it
      throw new NetworkError("Response is not JSON");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Don't log errors here - let safeFetch handle logging
    throw error;
  }
}

// Utility to detect browser extension interference
export function isBrowserExtensionActive(): boolean {
  if (typeof window === "undefined") return false;

  // Check for common extension indicators
  const extensionIndicators = [
    () => document.querySelector('script[src*="chrome-extension"]'),
    () => document.querySelector('script[src*="moz-extension"]'),
    () => (window as any).chrome && (window as any).chrome.runtime,
    () => (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
    () => (window as any).__REDUX_DEVTOOLS_EXTENSION__,
  ];

  return extensionIndicators.some((check) => {
    try {
      return check();
    } catch {
      return false;
    }
  });
}

// Create a safe fetch that falls back gracefully
export async function safeFetch<T = any>(
  url: string,
  options: FetchOptions = {},
  fallbackData?: T,
): Promise<{ data: T | null; error: string | null; success: boolean }> {
  try {
    const data = await fetchJSON<T>(url, {
      ...options,
      retries: isBrowserExtensionActive() ? 1 : 2, // Fewer retries if extensions detected
      timeout: 8000,
    });

    return {
      data,
      error: null,
      success: true,
    };
  } catch (error) {
    // Don't log common non-JSON errors (like 404s) to avoid console spam
    const isCommonError =
      error instanceof NetworkError &&
      (error.message.includes("Response is not JSON") ||
        error.message.includes("HTTP 404"));

    if (!isCommonError) {
      console.warn(
        `safeFetch failed for ${url}:`,
        error instanceof Error ? error.message : String(error),
      );
    }

    return {
      data: fallbackData || null,
      error: null, // Return null error to avoid exposing internal errors to UI
      success: false,
    };
  }
}
