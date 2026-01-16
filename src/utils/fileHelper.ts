/**
 * File Helper Utilities
 */

/**
 * Convert a File to base64 string (without data URL prefix)
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Data = (reader.result as string).split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Convert a data URL to Blob
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const res = await fetch(dataUrl);
  return await res.blob();
};

/**
 * Sanitize filename for use as ID
 * Removes special characters and truncates to max length
 */
export const sanitizeFilename = (name: string, maxLength = 50): string => {
  const truncated = name.length > maxLength ? name.substring(0, maxLength) : name;
  return truncated.replace(/[\\/:*?"<>|]/g, "_");
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

/**
 * Get MIME type from file extension
 */
export const getMimeTypeFromExtension = (ext: string): string => {
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return mimeTypes[ext.toLowerCase()] || "image/png";
};
