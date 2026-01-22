// Project type identifiers
export type ProjectType = 'text-to-video' | 'image-to-video';

// Stage definition structure
export interface StageDefinition {
  id: number;
  key: string;           // Unique identifier (e.g., 'upload', 'image-splitter')
  labelKey: string;      // i18n key for stage label
  component: string;     // Component name for dynamic rendering
}

// Project type configuration
export interface ProjectTypeConfig {
  type: ProjectType;
  labelKey: string;        // i18n key for project type name
  descriptionKey: string;  // i18n key for description
  icon: string;            // Icon identifier for UI
  stages: StageDefinition[];
}

// Stage configurations for Text-to-Video (existing pipeline)
const TEXT_TO_VIDEO_STAGES: StageDefinition[] = [
  { id: 1, key: 'upload', labelKey: 'mithril_stage1', component: 'UploadManager' },
  { id: 2, key: 'story-splitter', labelKey: 'mithril_stage2', component: 'StorySplitter' },
  { id: 3, key: 'character-sheet', labelKey: 'mithril_stage3', component: 'CharacterSheetGenerator' },
  { id: 4, key: 'storyboard', labelKey: 'mithril_stage4', component: 'StoryboardGenerator' },
  { id: 5, key: 'bg-sheet', labelKey: 'mithril_stage5', component: 'BgSheetGenerator' },
  { id: 6, key: 'image-gen', labelKey: 'mithril_stage6', component: 'ImageGenerator' },
  { id: 7, key: 'video-gen', labelKey: 'mithril_stage7', component: 'VideoGenerator' },
];

// Stage configurations for Image-to-Video (manga-to-anime pipeline)
const IMAGE_TO_VIDEO_STAGES: StageDefinition[] = [
  { id: 1, key: 'image-splitter', labelKey: 'mithril_i2v_stage1', component: 'ImageSplitter' },
  { id: 2, key: 'image-to-script', labelKey: 'mithril_i2v_stage2', component: 'ImageToScriptWriter' },
  // Future stages will be added here (e.g., character generation, video generation)
];

// Project type configurations
export const PROJECT_TYPE_CONFIGS: Record<ProjectType, ProjectTypeConfig> = {
  'text-to-video': {
    type: 'text-to-video',
    labelKey: 'project_type_text_to_video',
    descriptionKey: 'project_type_text_to_video_desc',
    icon: 'FileText',
    stages: TEXT_TO_VIDEO_STAGES,
  },
  'image-to-video': {
    type: 'image-to-video',
    labelKey: 'project_type_image_to_video',
    descriptionKey: 'project_type_image_to_video_desc',
    icon: 'Images',
    stages: IMAGE_TO_VIDEO_STAGES,
  },
};

// Helper functions

/**
 * Get the configuration for a project type
 */
export function getProjectTypeConfig(type: ProjectType): ProjectTypeConfig {
  return PROJECT_TYPE_CONFIGS[type];
}

/**
 * Get the total number of stages for a project type
 */
export function getTotalStages(type: ProjectType): number {
  return PROJECT_TYPE_CONFIGS[type].stages.length;
}

/**
 * Get a specific stage configuration
 */
export function getStageConfig(type: ProjectType, stageId: number): StageDefinition | undefined {
  return PROJECT_TYPE_CONFIGS[type].stages.find(s => s.id === stageId);
}

/**
 * Check if a stage ID is valid for a project type
 */
export function isValidStage(type: ProjectType, stageId: number): boolean {
  const totalStages = getTotalStages(type);
  return stageId >= 1 && stageId <= totalStages;
}

/**
 * Get all available project types
 */
export function getAvailableProjectTypes(): ProjectType[] {
  return Object.keys(PROJECT_TYPE_CONFIGS) as ProjectType[];
}

/**
 * Get the default project type
 */
export function getDefaultProjectType(): ProjectType {
  return 'text-to-video';
}
