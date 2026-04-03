/**
 * Server-side utility for securely fetching images from trusted S3/CDN origins.
 * Includes SSRF protection via an allow-list of permitted hostnames.
 */

const ALLOWED_HOSTNAME_SUFFIXES = [
  ".amazonaws.com",
  ".cloudfront.net",
  ".s3.amazonaws.com",
];

/**
 * Validates that a URL is safe to fetch (HTTPS, trusted S3/CDN host).
 * Throws if the URL fails any check.
 */
export function validateImageUrl(url: string): URL {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error(`Disallowed URL protocol: ${parsed.protocol}`);
  }
  const hostname = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTNAME_SUFFIXES.some((suffix) =>
    hostname.endsWith(suffix)
  );
  if (!allowed) {
    throw new Error(`Disallowed image hostname: ${hostname}`);
  }
  return parsed;
}

/**
 * Fetches an image from a trusted URL and returns base64 data + MIME type.
 * Validates the URL against the allow-list before fetching.
 */
export async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
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