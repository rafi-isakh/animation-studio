/**
 * Image compression utilities for reducing payload sizes
 * (Vercel has a 4.5MB request body limit)
 */

/**
 * Compress and resize an image blob to reduce payload size
 */
export function compressImage(
  blob: Blob | File,
  maxWidth = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Draw to canvas and compress
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with compression
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert a File/Blob to base64, with compression for large files
 */
export async function blobToBase64(blob: Blob | File): Promise<string> {
  // Compress if file is larger than 100KB
  if (blob.size > 100 * 1024) {
    return compressImage(blob);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Compress an existing base64 image string
 */
export function compressBase64Image(
  base64: string,
  maxWidth = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const compressedBase64 = dataUrl.split(',')[1];
      resolve(compressedBase64);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

/**
 * Check if a string is a URL
 */
export function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('blob:');
}

/**
 * Check if URL is an S3/CloudFront URL that needs proxying
 */
function isS3Url(url: string): boolean {
  let hostname: string | null = null;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return (
    hostname === 's3.amazonaws.com' ||
    hostname.endsWith('.s3.amazonaws.com') ||
    hostname === 's3.ap-northeast-2.amazonaws.com' ||
    hostname.endsWith('.s3.ap-northeast-2.amazonaws.com') ||
    hostname.endsWith('.cloudfront.net')
  );
}

/**
 * Fetch image from URL and convert to base64
 * Uses proxy API for S3 URLs to avoid CORS issues
 * Also compresses the image to reduce payload size
 */
export async function urlToBase64(
  url: string,
  maxWidth = 800,
  quality = 0.7
): Promise<string> {
  // For S3 URLs, use the proxy API to avoid CORS
  const fetchUrl = isS3Url(url)
    ? `/api/mithril/s3/proxy?url=${encodeURIComponent(url)}`
    : url;

  return new Promise((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for non-proxy URLs
    if (!isS3Url(url)) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };

    img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));
    img.src = fetchUrl;
  });
}
