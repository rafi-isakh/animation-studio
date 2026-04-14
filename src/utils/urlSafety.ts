import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * URL and path safety helpers for server-side fetches.
 * Keeps allowlists narrow and blocks common SSRF bypasses.
 */

const DEFAULT_ALLOWED_HOST_SUFFIXES: string[] = [];

const DEFAULT_ALLOWED_HOSTNAMES = new Set([
  "firestore.googleapis.com",
  "s3.amazonaws.com",
]);

type UrlAllowlistOptions = {
  allowedHostSuffixes?: string[];
  allowedHostnames?: Set<string>;
  allowHttp?: boolean;
  allowHttps?: boolean;
};

function isPrivateOrLocalIp(address: string): boolean {
  const ipVersion = isIP(address);
  if (ipVersion === 4) {
    const [a, b] = address.split(".").map((v) => Number(v));
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  if (ipVersion === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd")
    );
  }

  return false;
}

export async function assertAllowedUrl(
  url: string,
  options: UrlAllowlistOptions = {}
): Promise<URL> {
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

  if (parsed.username || parsed.password) {
    throw new Error("Disallowed URL credentials");
  }

  if (parsed.port) {
    if (
      (parsed.protocol === "https:" && parsed.port !== "443") ||
      (parsed.protocol === "http:" && parsed.port !== "80")
    ) {
      throw new Error(`Disallowed URL port: ${parsed.port}`);
    }
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowedHostSuffixes =
    options.allowedHostSuffixes ?? DEFAULT_ALLOWED_HOST_SUFFIXES;
  const allowedHostnames =
    options.allowedHostnames ?? DEFAULT_ALLOWED_HOSTNAMES;

  const allowed =
    allowedHostnames.has(hostname) ||
    allowedHostSuffixes.some((suffix) => {
      const normalized = suffix.toLowerCase().replace(/^\./, "");
      return hostname === normalized || hostname.endsWith(`.${normalized}`);
    });

  if (!allowed) {
    throw new Error(`Disallowed hostname: ${hostname}`);
  }

  const resolved = await lookup(hostname, { all: true });
  if (!resolved.length) {
    throw new Error(`Unable to resolve hostname: ${hostname}`);
  }
  if (resolved.some((entry) => isPrivateOrLocalIp(entry.address))) {
    throw new Error(`Disallowed resolved IP for hostname: ${hostname}`);
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

export function buildInternalServiceUrl(baseUrl: string, path: string): string {
  const trimmedPath = path.trim();
  if (
    trimmedPath.startsWith("http://") ||
    trimmedPath.startsWith("https://") ||
    trimmedPath.startsWith("//")
  ) {
    throw new Error("Invalid internal service path");
  }

  const base = new URL(baseUrl);
  if (base.protocol !== "http:" && base.protocol !== "https:") {
    throw new Error(`Disallowed URL protocol: ${base.protocol}`);
  }

  const full = new URL(trimmedPath, base);
  if (full.origin !== base.origin) {
    throw new Error("Cross-origin internal service URL is not allowed");
  }

  return full.toString();
}
