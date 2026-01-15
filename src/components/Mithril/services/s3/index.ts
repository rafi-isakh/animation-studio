/**
 * S3 Services for Mithril
 * Centralized exports for all S3-related operations
 */

// Types
export * from './types';

// Image & Video operations
export {
  // Character images (legacy)
  uploadCharacterImage,
  deleteCharacterImage,
  // Character images (new 3-tier system)
  uploadCharacterProfileImage,
  deleteCharacterProfileImage,
  uploadCharacterMasterSheetImage,
  deleteCharacterMasterSheetImage,
  uploadCharacterModeImage,
  deleteCharacterModeImage,
  // Style slot images
  uploadStyleSlotImage,
  deleteStyleSlotImage,
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