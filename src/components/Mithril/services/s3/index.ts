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
  // Prop Designer images
  uploadPropDesignSheetImage,
  uploadPropReferenceImage,
  deletePropDesignSheetImage,
  deletePropReferenceImage,
  deletePropImages,
  // Background images
  uploadBackgroundImage,
  deleteBackgroundImage,
  deleteAllBackgroundImages,
  uploadBackgroundReferenceImage,
  deleteBackgroundReferenceImage,
  // Storyboard images
  uploadStoryboardImage,
  deleteStoryboardImage,
  // ImageGen images
  uploadImageGenFrameImage,
  uploadImageGenRemixImage,
  uploadImageGenEditedImage,
  deleteImageGenFrameImage,
  deleteImageGenRemixImage,
  deleteImageGenEditedImage,
  // ImageGen replacement assets
  uploadImageGenReplacementAsset,
  deleteImageGenReplacementAsset,
  // I2V (Image-to-Video) images
  uploadI2VPageImage,
  uploadI2VPanelImage,
  deleteI2VPageImage,
  deleteI2VPanelImage,
  clearAllI2VImages,
  // Videos
  uploadVideo,
  deleteVideo,
  // Project cleanup
  clearAllProjectFiles,
} from './images';