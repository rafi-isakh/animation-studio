/**
 * URL and path safety helpers for server-side fetches.
 * Keeps allowlists narrow and blocks common SSRF bypasses.
 */

const DEFAULT_ALLOWED_HOST_SUFFIXES = [
  ".amazonaws.com",
  ".cloudfront.net",
  ".s3.amazonaws.com",
  ".firebasestorage.googleapis.com",
];

const DEFAULT_ALLOWED_HOSTNAMES = new Set([
  "firestore.googleapis.com",
]);

type UrlAllowlistOptions = {
  allowedHostSuffixes?: string[];
  allowedHostnames?: Set<string>;
  allowHttp?: boolean;
  allowHttps?: boolean;
};

export function assertAllowedUrl(
  url: string,
  options: UrlAllowlistOptions = {}
): URL {
  const parsed = new URL(url);
  const allowHttp = options.allowHttp ?? false;
  const allowHttps = options.allowHttps ?? true;

  if (parsed.protocol === "http:" && !allowHttp) {
    throw new Error("Disallowed URL protocol: http");
  }
  if (parsed.protocol === "https:" && !allowHttps) {
    throw new Error("Disallowed URL protocol: https");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Disallowed URL protocol: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowedHostSuffixes =
    options.allowedHostSuffixes ?? DEFAULT_ALLOWED_HOST_SUFFIXES;
  const allowedHostnames =
    options.allowedHostnames ?? DEFAULT_ALLOWED_HOSTNAMES;

  const allowed =
    allowedHostnames.has(hostname) ||
    allowedHostSuffixes.some((suffix) => hostname.endsWith(suffix));

  if (!allowed) {
    throw new Error(`Disallowed hostname: ${hostname}`);
  }

  return parsed;
}

type SafePathOptions = {
  allowSlash?: boolean;
  maxLength?: number;
};

export function assertSafePathSegment(
  value: string,
  options: SafePathOptions = {}
): string {
  const maxLength = options.maxLength ?? 256;
  const allowSlash = options.allowSlash ?? false;
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Invalid identifier: empty value");
  }
  if (trimmed.length > maxLength) {
    throw new Error("Invalid identifier: too long");
  }
  if (trimmed.includes("://") || trimmed.startsWith("//")) {
    throw new Error("Invalid identifier: contains protocol");
  }
  if (trimmed.includes("\\") || trimmed.includes("..")) {
    throw new Error("Invalid identifier: contains unsafe path");
  }
  if (!allowSlash && trimmed.includes("/")) {
    throw new Error("Invalid identifier: contains '/'");
  }

  const parts = allowSlash ? trimmed.split("/") : [trimmed];
  const segmentPattern = /^[A-Za-z0-9._-]+$/;
  for (const part of parts) {
    if (!part || !segmentPattern.test(part)) {
      throw new Error("Invalid identifier: bad characters");
    }
  }

  return trimmed;
}

export function encodePathPreservingSlashes(value: string): string {
  return value
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}
