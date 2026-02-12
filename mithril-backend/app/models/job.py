"""Job models for the video and image generation queue."""

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class JobType(str, Enum):
    """Job type enumeration."""

    VIDEO = "video"
    IMAGE = "image"
    BACKGROUND = "background"
    PROP_DESIGN_SHEET = "prop_design_sheet"
    PANEL = "panel"
    ID_CONVERTER_GLOSSARY = "id_converter_glossary"
    ID_CONVERTER_BATCH = "id_converter_batch"
    STORY_SPLITTER = "story_splitter"
    PANEL_SPLITTER = "panel_splitter"
    STORYBOARD = "storyboard"
    I2V_STORYBOARD = "i2v_storyboard"
    STORYBOARD_EDITOR = "storyboard_editor"


class JobStatus(str, Enum):
    """Job status enumeration."""

    PENDING = "pending"
    SUBMITTED = "submitted"  # Video: submitted to provider
    POLLING = "polling"  # Video: polling provider for completion
    PREPARING = "preparing"  # Image: fetching reference images from S3
    GENERATING = "generating"  # Image: calling AI provider
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ErrorCode(str, Enum):
    """Error code enumeration."""

    RATE_LIMIT = "rate_limit"
    QUOTA_EXCEEDED = "quota_exceeded"
    INVALID_REQUEST = "invalid_request"
    PROVIDER_ERROR = "provider_error"
    TIMEOUT = "timeout"
    INTERNAL_ERROR = "internal_error"
    CANCELLED = "cancelled"


class JobError(BaseModel):
    """Error information for failed jobs."""

    code: ErrorCode
    message: str
    retryable: bool = False
    retry_after: int | None = None  # Seconds to wait before retry


class JobSubmitRequest(BaseModel):
    """Request model for submitting a video generation job."""

    project_id: str
    scene_index: int
    clip_index: int
    provider_id: Literal["sora", "veo3"]
    prompt: str
    image_url: str | None = None
    duration: int = Field(ge=4, le=12)
    aspect_ratio: Literal["16:9", "9:16"]
    api_key: str | None = None  # Custom API key (optional)


class JobSubmitResponse(BaseModel):
    """Response model after submitting a job."""

    job_id: str
    status: JobStatus = JobStatus.PENDING
    created_at: datetime


class JobStatusResponse(BaseModel):
    """Response model for job status queries."""

    job_id: str
    status: JobStatus
    progress: float = 0.0
    provider_job_id: str | None = None
    video_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class JobDocument(BaseModel):
    """Firestore document model for job_queue collection."""

    id: str
    type: JobType = JobType.VIDEO  # Job type (video or image)
    project_id: str
    scene_index: int
    clip_index: int
    provider_id: str

    # Request parameters
    prompt: str
    image_url: str | None = None  # Video: source image for video generation
    duration: int | None = None  # Video only
    aspect_ratio: str
    api_key_hash: str | None = None  # Hashed for audit

    # Image-specific fields
    frame_id: str | None = None
    frame_label: str | None = None
    style_prompt: str | None = None
    reference_urls: list[str] = []  # S3 URLs for reference images (backgrounds, characters)

    # Background-specific fields (for type=BACKGROUND)
    bg_id: str | None = None  # Background ID
    bg_angle: str | None = None  # Angle: "Front View", "Worm View", etc.
    bg_name: str | None = None  # Background name for display

    # Prop design sheet-specific fields (for type=PROP_DESIGN_SHEET)
    prop_id: str | None = None  # Prop ID
    prop_name: str | None = None  # Prop name for display
    prop_category: str | None = None  # "character" or "object"

    # Panel editor-specific fields (for type=PANEL)
    session_id: str | None = None  # Session ID for standalone panel editor
    panel_id: str | None = None  # Panel ID within session
    file_name: str | None = None  # Original filename
    source_image_base64: str | None = None  # Base64 encoded source image
    source_mime_type: str | None = None  # MIME type of source image
    refinement_mode: str | None = None  # "default", "zoom", or "expand"

    # ID Converter-specific fields (for type=ID_CONVERTER_GLOSSARY or ID_CONVERTER_BATCH)
    original_text: str | None = None  # Full text for glossary analysis
    file_uri: str | None = None  # Gemini File API URI
    glossary_result: list[dict] | None = None  # Extracted entities
    total_chunks: int | None = None  # For batch conversion
    completed_chunks: int | None = None  # Completed chunk count
    current_chunk_index: int | None = None  # Currently processing chunk
    chunks_data: list[dict] | None = None  # Array of chunk conversion data

    # Story Splitter-specific fields (for type=STORY_SPLITTER)
    story_text: str | None = None  # Full story text to split
    guidelines: str | None = None  # Genre-specific splitting guidelines
    num_parts: int | None = None  # Number of parts to split into
    split_result: list[dict] | None = None  # Array of {text, cliffhangers} parts

    # Panel Splitter-specific fields (for type=PANEL_SPLITTER)
    page_id: str | None = None  # Page ID from frontend
    page_index: int | None = None  # Page index in sequence
    reading_direction: str | None = None  # 'rtl' or 'ltr'
    detected_panels: list[dict] | None = None  # Array of detected panels with box_2d

    # I2V Storyboard-specific fields (for type=I2V_STORYBOARD)
    panel_urls: list[str] = []  # S3 URLs of panel images
    panel_labels: list[str] = []  # Labels for each panel
    target_duration: str | None = None  # Target duration (MM:SS format)

    # Storyboard Editor-specific fields (for type=STORYBOARD_EDITOR)
    frame_type: str | None = None  # "start" or "end"
    operation: str | None = None  # "generate" or "remix"
    original_image_url: str | None = None  # For remix: S3 URL of source image
    original_context: str | None = None  # For remix: original prompt context
    remix_prompt: str | None = None  # For remix: modification instructions
    asset_image_urls: list[str] = []  # S3 URLs for color reference assets

    # Storyboard-specific fields (for type=STORYBOARD)
    source_text: str | None = None  # Source text for storyboard generation
    part_index: int | None = None  # Part index from story splitter
    target_time: str | None = None  # Target duration (MM:SS format)
    story_condition: str | None = None  # Story generation conditions
    image_condition: str | None = None  # Image prompt conditions
    video_condition: str | None = None  # Video prompt conditions
    sound_condition: str | None = None  # Sound conditions
    image_guide: str | None = None  # Additional image guide
    video_guide: str | None = None  # Additional video guide
    custom_instruction: str | None = None  # Custom story instructions
    background_instruction: str | None = None  # Background ID rules
    negative_instruction: str | None = None  # Negative prompts
    video_instruction: str | None = None  # Video prompt rules
    storyboard_result: dict | None = None  # {scenes: [...], voicePrompts: [...]}

    # Status tracking
    status: JobStatus = JobStatus.PENDING
    provider_job_id: str | None = None
    progress: float = 0.0

    # Results
    video_url: str | None = None  # Video result
    image_url: str | None = None  # Image result
    s3_file_name: str | None = None

    # Error handling
    error_code: str | None = None
    error_message: str | None = None
    error_retryable: bool | None = None
    retry_count: int = 0
    max_retries: int = 3

    # Cancellation
    cancellation_requested: bool = False
    cancelled_at: datetime | None = None

    # Cost tracking
    cost_usd: float = 0.0

    # Timestamps
    created_at: datetime
    updated_at: datetime
    submitted_at: datetime | None = None
    completed_at: datetime | None = None

    # Metadata
    user_id: str
    batch_id: str | None = None
    worker_id: str | None = None


class BatchSubmitRequest(BaseModel):
    """Request model for submitting multiple jobs."""

    project_id: str
    jobs: list[JobSubmitRequest]
    api_key: str | None = None


class BatchSubmitResponse(BaseModel):
    """Response model for batch job submission."""

    batch_id: str
    jobs: list[JobSubmitResponse]
    total_count: int
    status: str = "submitted"


# ============================================================================
# Image Job Models
# ============================================================================


class ImageJobSubmitRequest(BaseModel):
    """Request model for submitting an image generation job."""

    project_id: str
    frame_id: str
    scene_index: int
    clip_index: int
    frame_label: str
    prompt: str
    style_prompt: str | None = None
    reference_urls: list[str] = []  # Pre-uploaded S3 URLs for reference images
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    api_key: str | None = None  # Custom API key (optional)


class ImageJobStatusResponse(BaseModel):
    """Response model for image job status queries."""

    job_id: str
    status: JobStatus
    progress: float = 0.0
    image_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class ImageBatchSubmitRequest(BaseModel):
    """Request model for submitting multiple image jobs."""

    project_id: str
    jobs: list[ImageJobSubmitRequest]
    api_key: str | None = None


class ImageBatchSubmitResponse(BaseModel):
    """Response model for batch image job submission."""

    batch_id: str
    jobs: list[JobSubmitResponse]
    total_count: int
    status: str = "submitted"


# ============================================================================
# Background Job Models
# ============================================================================


class BgJobSubmitRequest(BaseModel):
    """Request model for submitting a background angle generation job."""

    project_id: str
    bg_id: str
    bg_angle: str  # "Front View", "Worm View", etc.
    bg_name: str
    prompt: str
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    reference_url: str | None = None  # Master reference image URL for style consistency
    api_key: str | None = None


class BgJobStatusResponse(BaseModel):
    """Response model for background job status queries."""

    job_id: str
    bg_id: str
    bg_angle: str
    bg_name: str
    status: JobStatus
    progress: float = 0.0
    image_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class BgBatchSubmitRequest(BaseModel):
    """Request model for submitting multiple background jobs."""

    project_id: str
    jobs: list[BgJobSubmitRequest]
    api_key: str | None = None  # Batch-level fallback


class BgBatchSubmitResponse(BaseModel):
    """Response model for batch background job submission."""

    batch_id: str
    jobs: list[JobSubmitResponse]
    total_count: int
    status: str = "submitted"


# ============================================================================
# Prop Design Sheet Job Models
# ============================================================================


class PropDesignSheetJobSubmitRequest(BaseModel):
    """Request model for submitting a prop design sheet generation job."""

    project_id: str
    prop_id: str
    prop_name: str
    category: Literal["character", "object"]
    prompt: str
    reference_urls: list[str] = []  # Pre-uploaded S3 URLs for reference images
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "1:1"
    api_key: str | None = None  # Custom API key (optional)


class PropDesignSheetJobStatusResponse(BaseModel):
    """Response model for prop design sheet job status queries."""

    job_id: str
    prop_id: str
    prop_name: str
    category: str
    status: JobStatus
    progress: float = 0.0
    image_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class PropDesignSheetBatchSubmitRequest(BaseModel):
    """Request model for submitting multiple prop design sheet jobs."""

    project_id: str
    jobs: list[PropDesignSheetJobSubmitRequest]
    api_key: str | None = None  # Batch-level fallback


class PropDesignSheetBatchSubmitResponse(BaseModel):
    """Response model for batch prop design sheet job submission."""

    batch_id: str
    jobs: list[JobSubmitResponse]
    total_count: int
    status: str = "submitted"


# ============================================================================
# Panel Editor Job Models
# ============================================================================


class PanelJobSubmitRequest(BaseModel):
    """Request model for submitting a panel editor job."""

    project_id: str  # Project ID for S3 storage (consistent with ImageSplitter)
    session_id: str  # Session ID for real-time tracking
    panel_id: str  # Panel ID within session
    file_name: str  # Original filename
    image_base64: str  # Base64 encoded source image
    mime_type: str = "image/png"  # MIME type of source image
    target_aspect_ratio: Literal["1:1", "16:9", "9:16", "4:3", "3:4"] = "16:9"
    refinement_mode: Literal["default", "zoom", "expand"] = "default"
    api_key: str | None = None  # Custom API key (optional)


class PanelJobStatusResponse(BaseModel):
    """Response model for panel job status queries."""

    job_id: str
    panel_id: str
    session_id: str
    status: JobStatus
    progress: float = 0.0
    image_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


# ============================================================================
# ID Converter Job Models
# ============================================================================


class IdConverterGlossaryJobSubmitRequest(BaseModel):
    """Request model for submitting a glossary analysis job."""

    project_id: str
    original_text: str  # Full text for entity analysis
    file_uri: str | None = None  # Optional Gemini File API URI
    api_key: str | None = None  # Custom API key (optional)


class IdConverterBatchJobSubmitRequest(BaseModel):
    """Request model for submitting a batch chunk conversion job."""

    project_id: str
    glossary: list[dict]  # List of entity objects with variants
    chunks: list[dict]  # List of {originalIndex, originalText}
    api_key: str | None = None  # Custom API key (optional)


class IdConverterChunkData(BaseModel):
    """Data model for a single chunk in batch conversion."""

    original_index: int
    original_text: str
    translated_text: str = ""
    status: Literal["pending", "processing", "completed", "error"] = "pending"


class IdConverterJobStatusResponse(BaseModel):
    """Response model for ID converter job status queries."""

    job_id: str
    job_type: Literal["glossary", "batch"]
    status: JobStatus
    progress: float = 0.0
    # Glossary job results
    entities: list[dict] | None = None
    entities_count: int | None = None
    # Batch job results
    total_chunks: int | None = None
    completed_chunks: int | None = None
    current_chunk_index: int | None = None
    # Error handling
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


# ============================================================================
# Story Splitter Job Models
# ============================================================================


class StorySplitterJobSubmitRequest(BaseModel):
    """Request model for submitting a story splitter job."""

    project_id: str
    text: str  # Full story text to split
    guidelines: str = ""  # Genre-specific splitting guidelines
    num_parts: int = Field(ge=2, le=50, default=8)  # Number of parts to split into
    api_key: str | None = None  # Custom API key (optional)


class StorySplitterCliffhanger(BaseModel):
    """Cliffhanger analysis for a story part."""

    sentence: str
    reason: str


class StorySplitterPart(BaseModel):
    """A single part of the split story."""

    text: str
    cliffhangers: list[StorySplitterCliffhanger] = []


class StorySplitterJobStatusResponse(BaseModel):
    """Response model for story splitter job status queries."""

    job_id: str
    status: JobStatus
    progress: float = 0.0
    # Result
    parts: list[StorySplitterPart] | None = None
    parts_count: int | None = None
    # Error handling
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


# ============================================================================
# Panel Splitter Job Models
# ============================================================================


class PanelSplitterJobSubmitRequest(BaseModel):
    """Request model for submitting a panel splitter job."""

    project_id: str
    page_id: str  # Page ID for tracking
    page_index: int  # Page index in sequence
    file_name: str  # Original filename
    image_base64: str  # Base64 encoded image
    reading_direction: Literal["rtl", "ltr"] = "rtl"
    api_key: str | None = None  # Custom API key (optional)


class DetectedPanel(BaseModel):
    """A single detected panel."""

    id: str
    box_2d: list[int]  # [ymin, xmin, ymax, xmax] in 0-1000 scale
    label: str = ""
    imageUrl: str | None = None  # S3 URL of cropped panel


class PanelSplitterJobStatusResponse(BaseModel):
    """Response model for panel splitter job status queries."""

    job_id: str
    page_id: str
    page_index: int
    file_name: str
    status: JobStatus
    progress: float = 0.0
    detected_panels: list[DetectedPanel] | None = None
    panel_count: int | None = None
    image_url: str | None = None  # S3 URL of source page
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class PanelSplitterPageItem(BaseModel):
    """A single page item in a batch panel splitter request."""

    page_id: str
    page_index: int
    file_name: str
    image_base64: str
    reading_direction: Literal["rtl", "ltr"] | None = None  # Override batch-level
    api_key: str | None = None  # Override batch-level


class PanelSplitterBatchSubmitRequest(BaseModel):
    """Request model for submitting multiple panel splitter jobs."""

    project_id: str
    pages: list[PanelSplitterPageItem]
    reading_direction: Literal["rtl", "ltr"] = "rtl"
    api_key: str | None = None  # Batch-level fallback


class PanelSplitterBatchSubmitResponse(BaseModel):
    """Response model for batch panel splitter job submission."""

    batch_id: str
    jobs: list[JobSubmitResponse]
    total_count: int
    status: str = "submitted"


# ============================================================================
# Storyboard Generation Job Models
# ============================================================================


class StoryboardJobSubmitRequest(BaseModel):
    """Request model for submitting a storyboard generation job."""

    project_id: str
    source_text: str  # Source text for storyboard generation
    part_index: int = 0  # Part index from story splitter
    target_time: str = "03:00"  # Target duration (MM:SS format)
    # Conditions
    story_condition: str = ""
    image_condition: str = ""
    video_condition: str = ""
    sound_condition: str = ""
    # Guides
    image_guide: str = ""
    video_guide: str = ""
    # Additional instructions
    custom_instruction: str = ""
    background_instruction: str = ""
    negative_instruction: str = ""
    video_instruction: str = ""
    # API key
    api_key: str | None = None


class StoryboardClip(BaseModel):
    """A single clip in a storyboard scene."""

    story: str
    imagePrompt: str
    imagePromptEnd: str | None = None
    videoPrompt: str
    soraVideoPrompt: str
    backgroundPrompt: str
    backgroundId: str
    dialogue: str
    dialogueEn: str
    narration: str = ""
    narrationEn: str = ""
    sfx: str
    sfxEn: str
    bgm: str
    bgmEn: str
    length: str
    accumulatedTime: str
    referenceImageIndex: int = 0


class StoryboardScene(BaseModel):
    """A single scene in the storyboard."""

    sceneTitle: str
    clips: list[StoryboardClip]


class StoryboardVoicePrompt(BaseModel):
    """Voice prompt for a character."""

    promptKo: str
    promptEn: str


class StoryboardCharacterIdSummary(BaseModel):
    """Character ID summary entry."""

    characterId: str
    description: str


class StoryboardJobStatusResponse(BaseModel):
    """Response model for storyboard job status queries."""

    job_id: str
    status: JobStatus
    progress: float = 0.0
    # Result
    scenes: list[StoryboardScene] | None = None
    voice_prompts: list[StoryboardVoicePrompt] | None = None
    character_id_summary: list[StoryboardCharacterIdSummary] | None = None
    genre: str | None = None
    scene_count: int | None = None
    clip_count: int | None = None
    # Error handling
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


# ============================================================================
# I2V Storyboard Generation Job Models
# ============================================================================


class I2VStoryboardJobSubmitRequest(BaseModel):
    """Request model for submitting an I2V storyboard generation job."""

    project_id: str
    panel_urls: list[str]  # S3 URLs of panel images
    panel_labels: list[str]  # Labels for each panel
    source_text: str = ""  # Optional context text
    target_duration: str = "03:00"  # Target duration (MM:SS format)
    # Conditions
    story_condition: str = ""
    image_condition: str = ""
    video_condition: str = ""
    sound_condition: str = ""
    # Guides
    image_guide: str = ""
    video_guide: str = ""
    # API key
    api_key: str | None = None


# ============================================================================
# Storyboard Editor Job Models
# ============================================================================


class StoryboardEditorJobSubmitRequest(BaseModel):
    """Request model for submitting a storyboard editor job (generate or remix)."""

    project_id: str
    scene_index: int
    clip_index: int
    frame_type: Literal["start", "end"]  # A or B frame
    operation: Literal["generate", "remix"]
    prompt: str  # Image prompt (for generate) or unused (for remix)
    reference_image_url: str | None = None  # S3 URL of manga panel reference
    asset_image_urls: list[str] = []  # S3 URLs of asset reference images
    # Remix-specific fields
    original_image_url: str | None = None  # S3 URL of image to remix
    original_context: str = ""  # Original image prompt for context
    remix_prompt: str = ""  # Modification instructions
    aspect_ratio: Literal["1:1", "16:9", "9:16"] = "16:9"
    api_key: str | None = None


class StoryboardEditorJobStatusResponse(BaseModel):
    """Response model for storyboard editor job status queries."""

    job_id: str
    scene_index: int
    clip_index: int
    frame_type: str
    operation: str
    status: JobStatus
    progress: float = 0.0
    image_url: str | None = None
    s3_file_name: str | None = None
    error: JobError | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None