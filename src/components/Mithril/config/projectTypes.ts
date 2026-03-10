// Project type identifiers
export type ProjectType =
  | 'text-to-video'
  | 'text-to-video-nsfw'
  | 'text-to-video-anime-bg'
  | 'text-to-video-nsfw-anime-bg'
  | 'manga-to-video'
  | 'manga-to-video-nsfw'
  | 'webtoon-to-video'
  | 'webtoon-to-video-nsfw'
  | 'image-to-video';              // legacy — kept for backward compatibility only

// Which underlying pipeline a project type uses
export type ProjectPipeline = 'text-to-video' | 'image-to-video';

// Stage definition structure
export interface StageDefinition {
  id: number;
  key: string;           // Unique identifier (e.g., 'upload', 'image-splitter')
  labelKey: string;      // i18n key for stage label
  component: string;     // Component name for dynamic rendering
  /**
   * Visibility of this stage in the main pipeline stepper.
   * - 'pipeline': shows as a step (default)
   * - 'tool': not shown as a step, but can still be rendered/used if navigated directly
   */
  visibility?: 'pipeline' | 'tool';
}

// Project type configuration
export interface ProjectTypeConfig {
  type: ProjectType;
  labelKey: string;        // i18n key for project type name
  descriptionKey: string;  // i18n key for description
  icon: string;            // Icon identifier for UI
  stages: StageDefinition[];
  pipeline: ProjectPipeline; // Which pipeline stages this type uses
  isNsfw: boolean;
  /** If true, this type is not shown as a creation option (legacy/backward compat) */
  deprecated?: boolean;
}

// Stage configurations for Text-to-Video (existing pipeline)
const TEXT_TO_VIDEO_STAGES: StageDefinition[] = [
  { id: 1, key: 'id-converter', labelKey: 'mithril_stage_id_converter', component: 'IdConverter' },
  { id: 2, key: 'story-splitter', labelKey: 'mithril_stage2', component: 'StorySplitter' },
  // Tool-only: kept for backwards compatibility + on-demand usage, but removed from the pipeline stepper.
  { id: 3, key: 'character-sheet', labelKey: 'mithril_stage3', component: 'CharacterSheetGenerator', visibility: 'tool' },
  { id: 4, key: 'storyboard', labelKey: 'mithril_stage4', component: 'StoryboardGenerator' },
  { id: 5, key: 'prop-designer', labelKey: 'mithril_stage5_prop', component: 'PropDesigner' },
  { id: 6, key: 'bg-sheet', labelKey: 'mithril_stage5', component: 'BgSheetGenerator' },
  { id: 7, key: 'image-gen', labelKey: 'mithril_stage6', component: 'ImageGenerator' },
  { id: 8, key: 'video-gen', labelKey: 'mithril_stage7', component: 'VideoGenerator' },
];

// Stage configurations for Text-to-Video with 3D BG (replaces BgSheetGenerator with AnimeBgStudio)
const TEXT_TO_VIDEO_3D_BG_STAGES: StageDefinition[] = [
  { id: 1, key: 'id-converter', labelKey: 'mithril_stage_id_converter', component: 'IdConverter' },
  { id: 2, key: 'story-splitter', labelKey: 'mithril_stage2', component: 'StorySplitter' },
  { id: 3, key: 'character-sheet', labelKey: 'mithril_stage3', component: 'CharacterSheetGenerator', visibility: 'tool' },
  { id: 4, key: 'storyboard', labelKey: 'mithril_stage4', component: 'StoryboardGenerator' },
  { id: 5, key: 'prop-designer', labelKey: 'mithril_stage5_prop', component: 'PropDesigner' },
  { id: 6, key: 'anime-bg-studio', labelKey: 'mithril_stage5_3d_bg', component: 'AnimeBgStudio' },
  { id: 7, key: 'image-gen', labelKey: 'mithril_stage6', component: 'ImageGenerator' },
  { id: 8, key: 'video-gen', labelKey: 'mithril_stage7', component: 'VideoGenerator' },
];

// Stage configurations for Image-to-Video (manga/webtoon pipeline)
const IMAGE_TO_VIDEO_STAGES: StageDefinition[] = [
  { id: 1, key: 'image-splitter', labelKey: 'mithril_i2v_stage1', component: 'ImageSplitter' },
  { id: 2, key: 'panel-editor', labelKey: 'mithril_i2v_stage2', component: 'PanelEditor' },
  { id: 3, key: 'image-to-script', labelKey: 'mithril_i2v_stage3', component: 'ImageToScriptWriter' },
  { id: 4, key: 'storyboard-editor', labelKey: 'mithril_i2v_stage4', component: 'StoryboardEditor' },
  { id: 5, key: 'video-gen', labelKey: 'mithril_i2v_stage5', component: 'I2VVideoGenerator' },
];

// Stage configurations for manga NSFW — PanelColorizer at Stage 2, CsvVideoGenerator at Stage 5
const IMAGE_TO_VIDEO_NSFW_STAGES: StageDefinition[] = [
  { id: 1, key: 'image-splitter',  labelKey: 'mithril_i2v_stage1',  component: 'ImageSplitter' },
  { id: 2, key: 'panel-colorizer', labelKey: 'mithril_i2v_stage2_colorizer', component: 'PanelColorizer' },
  { id: 3, key: 'image-to-script', labelKey: 'mithril_i2v_stage3',  component: 'ImageToScriptWriter' },
  { id: 4, key: 'prop-designer',   labelKey: 'mithril_stage5_prop', component: 'PropDesigner' },
  { id: 5, key: 'csv-video-gen',   labelKey: 'mithril_i2v_stage5',  component: 'CsvVideoGenerator' },
];

// Stage configurations for webtoon NSFW — PanelEditor at Stage 2, CsvVideoGenerator at Stage 5
const IMAGE_TO_VIDEO_WEBTOON_NSFW_STAGES: StageDefinition[] = [
  { id: 1, key: 'image-splitter',  labelKey: 'mithril_i2v_stage1',  component: 'ImageSplitter' },
  { id: 2, key: 'panel-editor',    labelKey: 'mithril_i2v_stage2',   component: 'PanelEditor' },
  { id: 3, key: 'image-to-script', labelKey: 'mithril_i2v_stage3',  component: 'ImageToScriptWriter' },
  { id: 4, key: 'prop-designer',   labelKey: 'mithril_stage5_prop', component: 'PropDesigner' },
  { id: 5, key: 'csv-video-gen',   labelKey: 'mithril_i2v_stage5',  component: 'CsvVideoGenerator' },
];

// Stage configurations for manga (non-NSFW) — PanelColorizer at Stage 2, CSV video generator
const IMAGE_TO_VIDEO_CSV_STAGES: StageDefinition[] = [
  { id: 1, key: 'image-splitter',  labelKey: 'mithril_i2v_stage1',  component: 'ImageSplitter' },
  { id: 2, key: 'panel-colorizer', labelKey: 'mithril_i2v_stage2_colorizer', component: 'PanelColorizer' },
  { id: 3, key: 'image-to-script', labelKey: 'mithril_i2v_stage3',  component: 'ImageToScriptWriter' },
  { id: 4, key: 'prop-designer',   labelKey: 'mithril_stage5_prop', component: 'PropDesigner' },
  { id: 5, key: 'csv-video-gen',   labelKey: 'mithril_i2v_stage5',  component: 'CsvVideoGenerator' },
];

// Stage configurations for webtoon (non-NSFW) — PanelEditor at Stage 2, CSV video generator
const IMAGE_TO_VIDEO_WEBTOON_STAGES: StageDefinition[] = [
  { id: 1, key: 'image-splitter',  labelKey: 'mithril_i2v_stage1',  component: 'ImageSplitter' },
  { id: 2, key: 'panel-editor',    labelKey: 'mithril_i2v_stage2',   component: 'PanelEditor' },
  { id: 3, key: 'image-to-script', labelKey: 'mithril_i2v_stage3',  component: 'ImageToScriptWriter' },
  { id: 4, key: 'prop-designer',   labelKey: 'mithril_stage5_prop', component: 'PropDesigner' },
  { id: 5, key: 'csv-video-gen',   labelKey: 'mithril_i2v_stage5',  component: 'CsvVideoGenerator' },
];

// Project type configurations
export const PROJECT_TYPE_CONFIGS: Record<ProjectType, ProjectTypeConfig> = {
  'text-to-video': {
    type: 'text-to-video',
    labelKey: 'project_type_text_to_video',
    descriptionKey: 'project_type_text_to_video_desc',
    icon: 'FileText',
    stages: TEXT_TO_VIDEO_STAGES,
    pipeline: 'text-to-video',
    isNsfw: false,
  },
  'text-to-video-nsfw': {
    type: 'text-to-video-nsfw',
    labelKey: 'project_type_text_to_video_nsfw',
    descriptionKey: 'project_type_text_to_video_nsfw_desc',
    icon: 'FileText',
    stages: TEXT_TO_VIDEO_STAGES,
    pipeline: 'text-to-video',
    isNsfw: true,
  },
  'text-to-video-anime-bg': {
    type: 'text-to-video-anime-bg',
    labelKey: 'project_type_text_to_video_3d_bg',
    descriptionKey: 'project_type_text_to_video_3d_bg_desc',
    icon: 'FileText',
    stages: TEXT_TO_VIDEO_3D_BG_STAGES,
    pipeline: 'text-to-video',
    isNsfw: false,
  },
  'text-to-video-nsfw-anime-bg': {
    type: 'text-to-video-nsfw-anime-bg',
    labelKey: 'project_type_text_to_video_nsfw_3d_bg',
    descriptionKey: 'project_type_text_to_video_nsfw_3d_bg_desc',
    icon: 'FileText',
    stages: TEXT_TO_VIDEO_3D_BG_STAGES,
    pipeline: 'text-to-video',
    isNsfw: true,
  },
  'manga-to-video': {
    type: 'manga-to-video',
    labelKey: 'project_type_manga_to_video',
    descriptionKey: 'project_type_manga_to_video_desc',
    icon: 'BookOpen',
    stages: IMAGE_TO_VIDEO_CSV_STAGES,
    pipeline: 'image-to-video',
    isNsfw: false,
  },
  'manga-to-video-nsfw': {
    type: 'manga-to-video-nsfw',
    labelKey: 'project_type_manga_to_video_nsfw',
    descriptionKey: 'project_type_manga_to_video_nsfw_desc',
    icon: 'BookOpen',
    stages: IMAGE_TO_VIDEO_NSFW_STAGES,
    pipeline: 'image-to-video',
    isNsfw: true,
  },
  'webtoon-to-video': {
    type: 'webtoon-to-video',
    labelKey: 'project_type_webtoon_to_video',
    descriptionKey: 'project_type_webtoon_to_video_desc',
    icon: 'Palette',
    stages: IMAGE_TO_VIDEO_WEBTOON_STAGES,
    pipeline: 'image-to-video',
    isNsfw: false,
  },
  'webtoon-to-video-nsfw': {
    type: 'webtoon-to-video-nsfw',
    labelKey: 'project_type_webtoon_to_video_nsfw',
    descriptionKey: 'project_type_webtoon_to_video_nsfw_desc',
    icon: 'Palette',
    stages: IMAGE_TO_VIDEO_WEBTOON_NSFW_STAGES,
    pipeline: 'image-to-video',
    isNsfw: true,
  },
  // Legacy type — kept so existing projects load correctly; not shown in creation UI
  'image-to-video': {
    type: 'image-to-video',
    labelKey: 'project_type_image_to_video',
    descriptionKey: 'project_type_image_to_video_desc',
    icon: 'Images',
    stages: IMAGE_TO_VIDEO_STAGES,
    pipeline: 'image-to-video',
    isNsfw: false,
    deprecated: true,
  },
};

// Helper functions

/**
 * Get the configuration for a project type.
 * Falls back to the default type if the given type is unknown (e.g. stale Firestore data).
 */
export function getProjectTypeConfig(type: ProjectType): ProjectTypeConfig {
  return PROJECT_TYPE_CONFIGS[type] ?? PROJECT_TYPE_CONFIGS[getDefaultProjectType()];
}

export function isPipelineStage(stage: StageDefinition): boolean {
  return (stage.visibility ?? 'pipeline') === 'pipeline';
}

export function getPipelineStages(type: ProjectType): StageDefinition[] {
  return PROJECT_TYPE_CONFIGS[type].stages.filter(isPipelineStage);
}

/**
 * Get the total number of stages for a project type
 */
export function getTotalStages(type: ProjectType): number {
  // Total *pipeline* steps (what the user sees in the stepper)
  return getPipelineStages(type).length;
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
  // IDs are not guaranteed to be contiguous anymore.
  return getStageConfig(type, stageId) != null;
}

/**
 * Get all available (non-deprecated) project types for the creation UI
 */
export function getAvailableProjectTypes(): ProjectType[] {
  return (Object.keys(PROJECT_TYPE_CONFIGS) as ProjectType[]).filter(
    type => !PROJECT_TYPE_CONFIGS[type].deprecated
  );
}

/**
 * Get the default project type
 */
export function getDefaultProjectType(): ProjectType {
  return 'text-to-video';
}

/**
 * Returns true for any Text-to-Video variant (general or NSFW)
 */
export function isTextToVideoType(type: ProjectType): boolean {
  return PROJECT_TYPE_CONFIGS[type].pipeline === 'text-to-video';
}

/**
 * Returns true for any Image-to-Video variant (manga, webtoon, legacy, general or NSFW)
 */
export function isImageToVideoType(type: ProjectType): boolean {
  return PROJECT_TYPE_CONFIGS[type].pipeline === 'image-to-video';
}
