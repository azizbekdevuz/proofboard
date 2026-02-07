/**
 * Server-side World ID proof verification helpers.
 * Pass WORLD_API_KEY in env so verify API accepts the request (Bearer auth).
 */

export function getVerifyHeaders(): Record<string, string> | undefined {
  const key = process.env.WORLD_API_KEY;
  if (!key?.trim()) return undefined;
  return { Authorization: `Bearer ${key.trim()}` };
}
