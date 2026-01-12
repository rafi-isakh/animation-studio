// Check if URL is an S3 URL that needs proxying
function isS3Url(url: string): boolean {
  return url.includes('s3.amazonaws.com') || url.includes('s3.ap-northeast-2.amazonaws.com');
}

// Fetch an image from URL (S3 or any URL) and convert to base64
// Uses a server-side proxy for S3 URLs to avoid CORS issues
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  // Use proxy for S3 URLs to avoid CORS
  const fetchUrl = isS3Url(url)
    ? `/api/mithril/s3/proxy?url=${encodeURIComponent(url)}`
    : url;

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const blob = await response.blob();
  const mimeType = blob.type || 'image/webp';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(new Error('Failed to convert image to base64'));
    reader.readAsDataURL(blob);
  });
}

// Check if a string is a URL (S3 or HTTP)
function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}

// Compress and resize image for API payload optimization
// Handles both base64 strings and S3/HTTP URLs
async function compressImage(
  imageData: string,
  mimeType: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<{ base64: string; mimeType: string }> {
  // If imageData is a URL, fetch it first
  let base64 = imageData;
  let actualMimeType = mimeType;

  if (isUrl(imageData)) {
    const fetched = await fetchImageAsBase64(imageData);
    base64 = fetched.base64;
    actualMimeType = fetched.mimeType;
  }

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous'; // Required for S3 URLs
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Only resize if larger than max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
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

      // Export as JPEG for better compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      const base64Only = compressedBase64.split(',')[1];

      resolve({ base64: base64Only, mimeType: 'image/jpeg' });
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = `data:${actualMimeType};base64,${base64}`;
  });
}

export { compressImage, fetchImageAsBase64, isUrl };