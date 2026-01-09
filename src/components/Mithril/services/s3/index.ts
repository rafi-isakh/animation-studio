/**
 * S3 Services for Mithril
 * Centralized exports for all S3-related operations
 */

// Types
export * from './types';

// Image & Video operations
export {
  // Character images
  uploadCharacterImage,
  deleteCharacterImage,
  // Background images
  uploadBackgroundImage,
  deleteBackgroundImage,
  deleteAllBackgroundImages,
  // Storyboard images
  uploadStoryboardImage,
  deleteStoryboardImage,
  // Videos
  uploadVideo,
  deleteVideo,
  // Project cleanup
  clearAllProjectFiles,
} from './images';