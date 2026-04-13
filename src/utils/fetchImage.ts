/**
 * Server-side utility for securely fetching images from trusted S3/CDN origins.
 * Includes SSRF protection via an allow-list of permitted hostnames.
 */

import { assertAllowedUrl } from "@/utils/urlSafety";

/**
 * Validates that a URL is safe to fetch (HTTPS, trusted S3/CDN host).
 * Throws if the URL fails any check.
 */
export function validateImageUrl(url: string): URL {
  return assertAllowedUrl(url);
}

/**
 * Fetches an image from a trusted URL and returns base64 data + MIME type.
 * Validates the URL against the allow-list before fetching.
 */
export async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  const allowedHostSuffixes = [
    ".amazonaws.com",
    ".cloudfront.net",
    ".firebasestorage.googleapis.com",
  ];
  const allowedHostnames = new Set(["firestore.googleapis.com"]);

  const isAllowed =
    allowedHostnames.has(hostname) ||
    allowedHostSuffixes.some((suffix) => hostname.endsWith(suffix));

  if (!isAllowed) {
    throw new Error(`Disallowed hostname: ${hostname}`);
  }

  const validated = validateImageUrl(url);
  const res = await fetch(validated.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status}`);
  }
  const contentType = res.headers.get("content-type") || "image/png";
  const mimeType = contentType.split(";")[0].trim();
  const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  return { base64, mimeType };
}
