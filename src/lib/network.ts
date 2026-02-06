/**
 * Network utilities for reliability on poor connections (World App Technical Requirements).
 * - Timeouts prevent infinite loading on Android/iOS.
 * - Same behavior across platforms (no platform-specific APIs).
 */

/** Default timeout for list/read requests (categories, questions, etc.) */
export const FETCH_TIMEOUT_MS = 15_000;

/** Timeout for write requests (post, comment, verify) */
export const FETCH_TIMEOUT_WRITE_MS = 30_000;

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly timeout?: boolean
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Try to get a user-facing error message from an API response (when !res.ok).
 * Falls back to status text or a default message.
 */
export async function getResponseError(res: Response, fallback = "Something went wrong."): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.error === "string") {
      if (data.error === "unauthorized") return "Please sign in again.";
      return data.error;
    }
  } catch {
    // ignore JSON parse errors
  }
  return res.statusText || fallback;
}

/**
 * Fetch with timeout. Prevents infinite loading on slow or broken connections.
 * Use for all API calls so the app remains reliable on Android and iOS.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal ?? controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    const isAbort = e instanceof Error && e.name === "AbortError";
    throw new NetworkError(
      isAbort
        ? "Request timed out. Check your connection and try again."
        : "Connection failed. Try again.",
      e,
      isAbort
    );
  }
}
