"""I2V (Image-to-Video) storyboard generation task handler."""

import asyncio
import copy
import json
import logging
import re
from typing import Any

import httpx
from google import genai
from google.genai import types

from app.config import get_settings
from app.core.errors import (
    VideoJobError,
    classify_exception,
)
from app.core.state_machine import JobStateMachine
from app.models.job import JobDocument, JobStatus
from app.services.firestore import get_job_queue_service

logger = logging.getLogger(__name__)
settings = get_settings()

MODEL_NAME = "gemini-3-pro-preview"

IMAGE_PROMPT_SUFFIX = "No vfx or visual effects, no dust particles"

# Concurrency control
I2V_STORYBOARD_CONCURRENCY = 3
_i2v_storyboard_semaphore = asyncio.Semaphore(I2V_STORYBOARD_CONCURRENCY)


class CancellationRequested(Exception):
    """Raised when job cancellation is detected."""
    pass


async def check_cancellation(job_id: str) -> None:
    """Check if cancellation has been requested for a job."""
    job_queue_service = get_job_queue_service()
    job = await job_queue_service.get_job(job_id)
    if job and job.cancellation_requested:
        logger.info(f"Cancellation detected for I2V storyboard job {job_id}")
        raise CancellationRequested(f"Job {job_id} was cancelled by user")


def _get_api_key(job: JobDocument, custom_api_key: str | None = None) -> str:
    """Get API key for Gemini."""
    if custom_api_key:
        return custom_api_key
    if not settings.gemini_api_key:
        raise VideoJobError.invalid_request("No Gemini API key configured")
    return settings.gemini_api_key


def _append_suffix(prompt: str) -> str:
    """Append the image prompt suffix if not already present."""
    if not prompt:
        return prompt
    trimmed = prompt.strip()
    suffix_lower = IMAGE_PROMPT_SUFFIX.lower()
    prompt_lower = trimmed.lower()

    if prompt_lower.endswith(suffix_lower) or prompt_lower.endswith(suffix_lower + '.'):
        return trimmed

    connector = " " if (trimmed.endswith('.') or trimmed.endswith(',')) else ", "
    return f"{trimmed}{connector}{IMAGE_PROMPT_SUFFIX}"


def _parse_duration(duration: str) -> int:
    """Parse MM:SS duration string to seconds."""
    parts = duration.split(":")
    if len(parts) == 2:
        minutes = int(parts[0])
        seconds = int(parts[1])
        return minutes * 60 + seconds
    return 180  # Default 3 minutes


def _format_time(seconds: int) -> str:
    """Format seconds to MM:SS."""
    mins = seconds // 60
    secs = seconds % 60
    return f"{str(mins).zfill(2)}:{str(secs).zfill(2)}"


def _extract_required_clip_count(text: str) -> int | None:
    """Parse the required clip count from the beginning of the source text.
    Looks for a number followed by 개/클립/패널/panels/clips in the first 800 chars.
    """
    import re
    if not text:
        return None
    prefix = text[:800]
    match = re.search(r'(\d+)\s*(?:개|클립|패널|panels?|clips?)', prefix, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def _resolve_required_clip_count(source_text: str, total_panels: int) -> int:
    """Resolve target clip count while preserving strict panel mapping semantics."""
    parsed = _extract_required_clip_count(source_text)
    if parsed is None:
        return total_panels
    if parsed != total_panels:
        logger.warning(
            "[I2V-STORYBOARD] Parsed clip count (%s) differs from panel count (%s); using panel count for 1:1 mapping",
            parsed,
            total_panels,
        )
        return total_panels
    return parsed


_PANEL_HEADER_RE = re.compile(
    r'^\s*(?:[#>*\-\[]\s*)?(?:panel|패널|컷|clip|frame|scene)\s*[:#\-]?\s*(\d+)\b',
    re.IGNORECASE,
)


def _normalize_bool(value: str) -> bool | None:
    normalized = re.sub(r'[^a-zA-Z가-힣0-9]+', '', value).lower()
    if not normalized:
        return None

    truthy = {
        'yes', 'true', 'y', '1', 'present', 'visible', '있음', '예', '유', '노출', '보임',
    }
    falsy = {
        'no', 'false', 'n', '0', 'absent', 'hidden', '없음', '아니오', '무', '안보임', '미노출',
    }

    if normalized in truthy:
        return True
    if normalized in falsy:
        return False
    return None


def _match_panel_field(line: str) -> tuple[str, str] | None:
    field_patterns = {
        'facePresent': [
            r'face\s*present',
        ],
        'refFileName': [
            r'reference\s*(?:image\s*)?(?:file(?:name)?|filename)',
            r'ref(?:erence)?\s*(?:image\s*)?(?:file(?:name)?|filename)',
            r'panel\s*file(?:name)?',
        ],
        'pixAiPrompt': [
            r'(?:recommended\s*)?pix\s*ai(?:\s*(?:prompt|프롬프트))?',
        ],
        'nsfw': [
            r'nsfw',
        ],
        'nudityVisible': [
            r'(?:nudity|nude|naked)(?:\s*(?:visible|present))?',
            r'알몸(?:\s*노출)?',
            r'노출',
        ],
    }

    for field_name, patterns in field_patterns.items():
        for pattern in patterns:
            match = re.match(rf'^\s*(?:[-*]\s*)?(?:{pattern})\s*[:：\-]\s*(.*)$', line, re.IGNORECASE)
            if match:
                return field_name, match.group(1).strip()
    return None


def _parse_panel_metadata(source_text: str) -> list[dict[str, Any]]:
    if not source_text:
        return []

    lines = source_text.splitlines()
    panels: list[dict[str, Any]] = []
    current_panel: dict[str, Any] | None = None
    current_field: str | None = None
    current_buffer: list[str] = []

    def ensure_panel(next_panel_index: int | None = None) -> dict[str, Any]:
        nonlocal current_panel
        if current_panel is None:
            current_panel = {
                'panelIndex': next_panel_index if next_panel_index is not None else len(panels),
                'rawSection': '',
            }
        return current_panel

    def flush_field() -> None:
        nonlocal current_field, current_buffer
        if current_panel is None or current_field is None:
            current_field = None
            current_buffer = []
            return

        value = '\n'.join(part for part in current_buffer if part is not None).strip()
        if current_field in {'facePresent', 'nsfw', 'nudityVisible'}:
            current_panel[current_field] = _normalize_bool(value)
        elif value:
            current_panel[current_field] = value

        current_field = None
        current_buffer = []

    def flush_panel() -> None:
        nonlocal current_panel
        if current_panel is None:
            return
        flush_field()
        raw_section = str(current_panel.get('rawSection', '')).strip()
        if raw_section:
            lowered = raw_section.lower()
            if current_panel.get('nsfw') is None and 'nsfw' in lowered:
                current_panel['nsfw'] = True
            if current_panel.get('nudityVisible') is None and any(keyword in lowered for keyword in ('nudity', 'nude', 'naked', '알몸', '나체')):
                current_panel['nudityVisible'] = True

        has_content = any(
            current_panel.get(key) not in (None, '', False)
            for key in ('refFileName', 'pixAiPrompt', 'facePresent', 'nsfw', 'nudityVisible')
        )
        if has_content:
            panels.append(current_panel)
        current_panel = None

    for line in lines:
        header_match = _PANEL_HEADER_RE.match(line)
        if header_match:
            flush_panel()
            current_panel = {
                'panelIndex': max(int(header_match.group(1)) - 1, 0),
                'rawSection': line.strip(),
            }
            continue

        matched_field = _match_panel_field(line)
        if matched_field:
            field_name, value = matched_field
            panel = ensure_panel()
            if field_name in panel and panel.get(field_name) not in (None, '', False) and all(
                panel.get(key) in (None, '', False) for key in ('pixAiPrompt', 'refFileName') if key != field_name
            ):
                flush_panel()
                panel = ensure_panel()
            flush_field()
            current_field = field_name
            current_buffer = [value] if value else []
            panel['rawSection'] = f"{panel.get('rawSection', '')}\n{line.strip()}".strip()
            continue

        if current_panel is not None:
            current_panel['rawSection'] = f"{current_panel.get('rawSection', '')}\n{line.strip()}".strip()
        if current_field is not None:
            current_buffer.append(line.strip())

    flush_panel()

    if not panels:
        return []

    panels.sort(key=lambda item: int(item.get('panelIndex', 0)))
    for sequential_index, panel in enumerate(panels):
        panel['panelIndex'] = sequential_index if panel.get('panelIndex') is None else int(panel['panelIndex'])
    return panels


def _split_prompt_segments(prompt: str) -> list[str]:
    return [segment.strip() for segment in re.split(r'[\n,;]+', prompt) if segment.strip()]


def _extract_location_key(background_id: str) -> str:
    if not background_id:
        return ''
    parts = background_id.split('-')
    return parts[0].strip() if parts else ''


def _extract_character_ids(story_text: str) -> set[str]:
    if not story_text:
        return set()
    return {match.group(0) for match in re.finditer(r'\b[A-Z][A-Z0-9_]{1,}\b', story_text)}


def _extract_story_tokens(story_text: str) -> set[str]:
    if not story_text:
        return set()
    raw_tokens = re.findall(r'[A-Za-z가-힣0-9_]{2,}', story_text)
    stop_words = {
        '장면', '그리고', '그러나', '또한', '있는', '없는', '대한', '에서', '으로', '하는',
        '했다', '한다', '하고', '같은', '대한', '모습', '보인다', '있다', '없다',
    }
    normalized = {token.lower() for token in raw_tokens}
    return {token for token in normalized if token not in stop_words}


def _is_repetitive_visual_moment(story_text: str) -> bool:
    if not story_text:
        return False
    lowered = story_text.lower()
    visual_patterns = [
        'blink', 'blinking', 'stare', 'staring', 'gaze', 'gazing',
        '눈을 깜박', '깜박이', '주시', '응시', '쳐다보', '바라보',
    ]
    return any(pattern in lowered for pattern in visual_patterns)


def _jaccard_similarity(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    union = left.union(right)
    if not union:
        return 0.0
    return len(left.intersection(right)) / len(union)


def _should_merge_story_groups(prev_clip: dict[str, Any], current_clip: dict[str, Any]) -> bool:
    prev_story = str(prev_clip.get('storyDetailKo') or prev_clip.get('story') or '').strip()
    current_story = str(current_clip.get('storyDetailKo') or current_clip.get('story') or '').strip()
    if not prev_story or not current_story:
        return False

    prev_bg_prompt = str(prev_clip.get('backgroundPrompt') or '').strip().lower()
    current_bg_prompt = str(current_clip.get('backgroundPrompt') or '').strip().lower()
    same_background_prompt = bool(prev_bg_prompt and prev_bg_prompt == current_bg_prompt)

    prev_location = _extract_location_key(str(prev_clip.get('backgroundId') or ''))
    current_location = _extract_location_key(str(current_clip.get('backgroundId') or ''))
    same_location = bool(prev_location and prev_location == current_location)

    prev_characters = _extract_character_ids(prev_story)
    current_characters = _extract_character_ids(current_story)
    shared_characters = bool(prev_characters.intersection(current_characters))

    token_similarity = _jaccard_similarity(
        _extract_story_tokens(prev_story),
        _extract_story_tokens(current_story),
    )
    visually_repetitive = _is_repetitive_visual_moment(prev_story) and _is_repetitive_visual_moment(current_story)

    if same_background_prompt and (token_similarity >= 0.2 or shared_characters or visually_repetitive):
        return True

    if same_location and (token_similarity >= 0.25 or shared_characters or visually_repetitive):
        return True

    if shared_characters and token_similarity >= 0.35:
        return True

    return False


def _apply_grouped_story_labels(result: dict[str, Any]) -> dict[str, Any]:
    scenes = result.get('scenes', [])
    flattened: list[dict[str, Any]] = []
    for scene in scenes:
        for clip in scene.get('clips', []):
            original_story = str(clip.get('story') or '').strip()
            clip['storyDetailKo'] = original_story
            flattened.append(clip)

    if not flattened:
        return result

    grouped_ranges: list[tuple[int, int]] = []
    group_start = 0

    for idx in range(1, len(flattened)):
        if not _should_merge_story_groups(flattened[idx - 1], flattened[idx]):
            grouped_ranges.append((group_start, idx - 1))
            group_start = idx
    grouped_ranges.append((group_start, len(flattened) - 1))

    for group_index, (start_idx, end_idx) in enumerate(grouped_ranges, start=1):
        group_size = end_idx - start_idx + 1
        group_label = f"Story {group_index}:"
        for clip_index in range(start_idx, end_idx + 1):
            clip = flattened[clip_index]
            clip['storyGroupLabel'] = group_label
            clip['storyGroupSize'] = group_size

    return result


def _extract_primary_actor(text: str) -> str:
    if not text:
        return "인물"
    match = re.search(r'\b([A-Z][A-Z0-9_]{1,})\b', text)
    if match:
        return match.group(1)
    return "인물"


def _build_korean_story_fallback(clip: dict[str, Any]) -> str:
    actor = _extract_primary_actor(str(clip.get("story") or "") + " " + str(clip.get("dialogue") or ""))
    bg_id = str(clip.get("backgroundId") or "")
    bg_prompt = str(clip.get("backgroundPrompt") or "").strip()
    dialogue = str(clip.get("dialogue") or "").strip()

    if dialogue:
        return f"배경 {bg_id} 장면에서 {actor}가 상황에 반응하며 대사를 전하는 순간으로, 인물의 행동과 감정 변화가 뚜렷하게 드러난다."

    if bg_prompt:
        return f"배경 {bg_id}의 {bg_prompt} 분위기 속에서 {actor}가 주변을 주시하며 다음 행동을 준비하는 장면으로, 장면의 맥락과 흐름이 명확하게 이어진다."

    return f"배경 {bg_id} 장면에서 {actor}가 현재 상황에 맞는 행동을 수행하는 순간을 묘사하며, 누가 무엇을 하는지 분명하게 이해할 수 있도록 구성된 장면이다."


def _ensure_story_quality(result: dict[str, Any]) -> dict[str, Any]:
    for scene in result.get("scenes", []):
        for clip in scene.get("clips", []):
            story = str(clip.get("story") or "").strip()
            has_korean = bool(re.search(r'[가-힣]', story))

            if not story or not has_korean:
                clip["story"] = _build_korean_story_fallback(clip)
                continue

            # Story must carry meaningful context about actor and action.
            if len(story) < 28:
                supplement = _build_korean_story_fallback(clip)
                if supplement not in story:
                    clip["story"] = f"{story} {supplement}".strip()

    return result


def _flatten_clips(result: dict[str, Any]) -> list[dict[str, Any]]:
    flattened: list[dict[str, Any]] = []
    for scene in result.get("scenes", []):
        flattened.extend(scene.get("clips", []))
    return flattened


def _enforce_required_clip_count(result: dict[str, Any], required_clip_count: int, total_panels: int) -> dict[str, Any]:
    scenes = result.get("scenes", [])
    if not scenes:
        result["scenes"] = [{"sceneTitle": "Scene 1", "clips": []}]
        scenes = result["scenes"]

    flattened = _flatten_clips(result)

    if not flattened:
        default_clip = {
            "story": "배경 1-1 장면에서 인물이 상황을 인지하며 다음 행동을 준비하는 장면이다.",
            "imagePrompt": "medium shot of CHARACTER_ID observing the surroundings",
            "videoPrompt": "character maintains calm posture",
            "dialogue": "",
            "dialogueEn": "",
            "sfx": "",
            "sfxEn": "",
            "bgm": "",
            "bgmEn": "",
            "length": "00:01",
            "accumulatedTime": "00:01",
            "backgroundPrompt": "",
            "backgroundId": "1-1",
            "referenceImageIndex": 0,
        }
        flattened = [default_clip]

    # Deterministic 1:1 panel->clip mapping: every output index maps to exactly one clip.
    # Prefer clips that already reference the same panel index; fallback to same-position clip;
    # finally fallback to the last clip when source output is sparse.
    by_reference_index: dict[int, dict[str, Any]] = {}
    for fallback_idx, clip in enumerate(flattened):
        try:
            ref_idx = int(clip.get("referenceImageIndex", fallback_idx))
        except (TypeError, ValueError):
            ref_idx = fallback_idx
        if ref_idx not in by_reference_index:
            by_reference_index[ref_idx] = clip

    normalized_flattened: list[dict[str, Any]] = []
    seed_clip = flattened[-1]
    for idx in range(required_clip_count):
        source_clip = by_reference_index.get(idx)
        if source_clip is None:
            source_clip = flattened[idx] if idx < len(flattened) else seed_clip

        new_clip = copy.deepcopy(source_clip)
        new_clip["referenceImageIndex"] = idx
        new_clip["accumulatedTime"] = _format_time(idx + 1)
        normalized_flattened.append(new_clip)

    flattened = normalized_flattened

    # Rebuild scene clips: keep all clips in existing scene order; overflow goes to the last scene.
    scene_lengths = [len(scene.get("clips", [])) for scene in scenes]
    if not any(scene_lengths):
        scene_lengths = [required_clip_count]
    else:
        base_sum = sum(scene_lengths[:-1])
        scene_lengths[-1] = max(required_clip_count - base_sum, 0)

    cursor = 0
    rebuilt_scenes: list[dict[str, Any]] = []
    for scene_idx, scene in enumerate(scenes):
        take = scene_lengths[scene_idx] if scene_idx < len(scene_lengths) else 0
        scene_clips = flattened[cursor:cursor + take]
        cursor += take
        rebuilt_scenes.append({
            "sceneTitle": scene.get("sceneTitle", f"Scene {scene_idx + 1}"),
            "clips": scene_clips,
        })

    if cursor < len(flattened):
        rebuilt_scenes[-1]["clips"].extend(flattened[cursor:])

    # Drop empty scenes created by truncation.
    result["scenes"] = [scene for scene in rebuilt_scenes if scene.get("clips")]
    if not result["scenes"]:
        result["scenes"] = [{"sceneTitle": "Scene 1", "clips": flattened}]

    return result


def _sanitize_video_prompt(prompt: str, *, remove_speech: bool, remove_camera: bool) -> str:
    if not prompt:
        return ''

    speech_pattern = re.compile(
        r'\b(?:speak|speaks|speaking|talk|talks|talking|yell|yells|yelling|shout|shouts|shouting|whisper|whispers|whispering|say|says|saying|dialogue|lip\s*sync|mouth\s*(?:movement|visible)|head\s*(?:angle\s*)?stays?\s*still)\b',
        re.IGNORECASE,
    )
    camera_pattern = re.compile(
        r'\b(?:camera|shot|tracking|track|pan|panning|tilt|zoom|dolly|handheld|pedestal|crane|whip\s*pan|push\s*-?in|pull\s*-?back|follow|close\s*up|medium\s*shot|wide\s*shot|low\s*angle|high\s*angle|pov)\b',
        re.IGNORECASE,
    )

    kept_segments: list[str] = []
    for segment in _split_prompt_segments(prompt):
        if remove_speech and speech_pattern.search(segment):
            continue
        if remove_camera and camera_pattern.search(segment):
            continue
        kept_segments.append(segment)

    return ', '.join(kept_segments).strip(' ,')


def _allows_video_prompt_terms(video_condition: str, video_instruction: str) -> tuple[bool, bool]:
    """Infer whether camera/speech terms should be retained from user-provided rules."""
    merged = f"{video_condition}\n{video_instruction}".lower()

    allows_camera = any(keyword in merged for keyword in [
        'camera', 'camera movement', 'tracking', 'pan', 'tilt', 'zoom', 'dolly', 'handheld',
        '카메라', '앵글', '무빙',
    ])
    forbids_camera = any(keyword in merged for keyword in [
        'no camera movement', 'without camera movement', '카메라 움직임 금지', '카메라 무빙 금지',
    ])

    allows_speech = any(keyword in merged for keyword in [
        'speaks', 'talks', 'yells', 'shouts', 'dialogue keyword', '발화', '대사',
    ])
    forbids_speech = any(keyword in merged for keyword in [
        'do not use speaks', 'no speech verbs', '발화 표현 금지', '대사 동사 금지',
    ])

    return (allows_camera and not forbids_camera), (allows_speech and not forbids_speech)


def _normalize_clip_defaults(result: dict[str, Any], total_panels: int) -> dict[str, Any]:
    for scene in result.get('scenes', []):
        for clip_index, clip in enumerate(scene.get('clips', [])):
            clip['videoApi'] = str(clip.get('videoApi') or 'Grok').strip() or 'Grok'
            clip['soraVideoPrompt'] = str(clip.get('soraVideoPrompt') or clip.get('videoPrompt') or '').strip()

            try:
                ref_idx = int(clip.get('referenceImageIndex', clip_index))
            except (TypeError, ValueError):
                ref_idx = clip_index

            max_index = max(total_panels - 1, 0)
            clip['referenceImageIndex'] = min(max(ref_idx, 0), max_index)

    return result


def _dedupe_background_ids(result: dict[str, Any]) -> dict[str, Any]:
    """Normalize background IDs to unique X-Y[-n] form across flattened clip order."""
    seen_counts: dict[str, int] = {}

    def to_base_id(raw_id: str) -> str:
        parts = [part.strip() for part in str(raw_id).split('-') if part.strip()]
        if len(parts) >= 2 and parts[0].isdigit() and parts[1].isdigit():
            return f"{parts[0]}-{parts[1]}"
        return "1-1"

    for scene in result.get('scenes', []):
        for clip in scene.get('clips', []):
            base_id = to_base_id(str(clip.get('backgroundId') or ''))
            current_count = seen_counts.get(base_id, 0)
            clip['backgroundId'] = base_id if current_count == 0 else f"{base_id}-{current_count}"
            seen_counts[base_id] = current_count + 1

    return result


def _apply_panel_label_fallback(result: dict[str, Any], panel_labels: list[str]) -> dict[str, Any]:
    """Use panel labels as fallback reference filenames when refFileName is missing."""
    if not panel_labels:
        return result

    for scene in result.get('scenes', []):
        for clip_index, clip in enumerate(scene.get('clips', [])):
            existing_ref_name = str(clip.get('refFileName') or '').strip()
            if existing_ref_name:
                continue

            try:
                ref_idx = int(clip.get('referenceImageIndex', clip_index))
            except (TypeError, ValueError):
                ref_idx = clip_index

            if 0 <= ref_idx < len(panel_labels):
                label = str(panel_labels[ref_idx] or '').strip()
                if label:
                    clip['refFileName'] = label

    return result


def _apply_panel_metadata_to_result(
    result: dict[str, Any],
    source_text: str,
    *,
    allow_camera_terms: bool,
    allow_speech_terms: bool,
) -> dict[str, Any]:
    panel_metadata = _parse_panel_metadata(source_text)
    if not panel_metadata:
        for scene in result.get('scenes', []):
            for clip in scene.get('clips', []):
                clip['videoPrompt'] = _sanitize_video_prompt(
                    clip.get('videoPrompt', ''),
                    remove_speech=not allow_speech_terms,
                    remove_camera=not allow_camera_terms,
                )
        return result

    # Build a lookup by panelIndex (the actual panel number from source text) so that
    # sparse lists (only panels with content are included) are matched correctly.
    panel_lookup: dict[int, dict[str, Any]] = {pm['panelIndex']: pm for pm in panel_metadata}

    for scene in result.get('scenes', []):
        for clip_index, clip in enumerate(scene.get('clips', [])):
            panel_index = clip.get('referenceImageIndex', clip_index)
            try:
                panel_index = int(panel_index)
            except (TypeError, ValueError):
                panel_index = clip_index

            metadata = panel_lookup.get(panel_index) or panel_lookup.get(clip_index)

            if metadata:
                ref_file_name = str(metadata.get('refFileName', '') or '').strip()
                pix_ai_prompt = str(metadata.get('pixAiPrompt', '') or '').strip()
                if ref_file_name:
                    clip['refFileName'] = ref_file_name
                if pix_ai_prompt:
                    clip['pixAiPrompt'] = pix_ai_prompt

                face_present = metadata.get('facePresent')
                if face_present is not None:
                    clip['facePresent'] = face_present

                clip['videoPrompt'] = _sanitize_video_prompt(
                    clip.get('videoPrompt', ''),
                    remove_speech=not allow_speech_terms,
                    remove_camera=not allow_camera_terms,
                )

                nsfw = metadata.get('nsfw') is True
                nudity_visible = metadata.get('nudityVisible') is True
                if nsfw and nudity_visible:
                    addition = 'one or two sweat drops beautifully'
                    current_prompt = clip.get('videoPrompt', '').strip()
                    if addition.lower() not in current_prompt.lower():
                        clip['videoPrompt'] = f"{current_prompt}, {addition}".strip(' ,')
            else:
                clip['videoPrompt'] = _sanitize_video_prompt(
                    clip.get('videoPrompt', ''),
                    remove_speech=not allow_speech_terms,
                    remove_camera=not allow_camera_terms,
                )

    return result


async def _download_panel_images(panel_urls: list[str]) -> list[bytes]:
    """Download panel images from S3 URLs."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [client.get(url) for url in panel_urls]
        responses = await asyncio.gather(*tasks)

    images = []
    for i, resp in enumerate(responses):
        if resp.status_code != 200:
            raise ValueError(f"Failed to download panel {i} from {panel_urls[i]}: {resp.status_code}")
        images.append(resp.content)
    return images


async def process_i2v_storyboard(
    job_id: str,
    custom_api_key: str | None = None,
    worker_id: str = "worker-1",
) -> dict:
    """
    Generate a storyboard from manga panel images.

    This job:
    1. Downloads panel images from S3 URLs
    2. Calls Gemini to generate storyboard scenes and clips
    3. Saves result to Firestore i2vScript document
    4. Updates job status

    Args:
        job_id: The job ID to process
        custom_api_key: Optional custom API key
        worker_id: ID of the worker processing this job

    Returns:
        dict with status and result information
    """
    job_queue_service = get_job_queue_service()

    logger.info(f"[{worker_id}] ========== Starting I2V storyboard job {job_id} ==========")

    # Fetch job from Firestore
    job = await job_queue_service.get_job(job_id)
    if not job:
        logger.error(f"[I2V-STORYBOARD] Job {job_id} not found in Firestore")
        return {"job_id": job_id, "status": "error", "error": "Job not found"}

    logger.info(f"[I2V-STORYBOARD] Job {job_id} loaded: project={job.project_id}, panels={len(job.panel_urls)}")
    logger.info(f"[I2V-STORYBOARD] Target duration: {job.target_duration}")

    # Initialize state machine
    state_machine = JobStateMachine(job_id, job.status)

    # Mark job as being processed by this worker
    await job_queue_service.update_job(job_id, worker_id=worker_id)

    try:
        async with _i2v_storyboard_semaphore:
            # Get API key
            api_key = _get_api_key(job, custom_api_key)

            # Transition to PREPARING (downloading images)
            state_machine.transition_to(JobStatus.PREPARING)
            await job_queue_service.update_job_status(job_id, JobStatus.PREPARING, progress=0.1)
            logger.info(f"[I2V-STORYBOARD] {job_id} - Downloading panel images...")

            # Check for cancellation
            await check_cancellation(job_id)

            # Download panel images from S3
            panel_images = await _download_panel_images(job.panel_urls)
            logger.info(f"[I2V-STORYBOARD] {job_id} - Downloaded {len(panel_images)} panel images")

            # Transition to GENERATING
            state_machine.transition_to(JobStatus.GENERATING)
            await job_queue_service.update_job_status(job_id, JobStatus.GENERATING, progress=0.3)
            logger.info(f"[I2V-STORYBOARD] {job_id} - Calling Gemini API...")

            # Check for cancellation before AI call
            await check_cancellation(job_id)

            # Call Gemini for storyboard generation
            result = await _generate_i2v_storyboard_with_gemini(job, api_key, panel_images)
            logger.info(f"[I2V-STORYBOARD] {job_id} - Generated {len(result.get('scenes', []))} scenes")

            try:
                from app.services.credits import get_credit_cost, get_credits_service
                _cost = get_credit_cost(job.type.value, "gemini")
                await get_credits_service().record_credit(
                    user_id=job.user_id, project_id=job.project_id,
                    job_id=job.id, job_type=job.type.value,
                    provider_id="gemini", cost_usd=_cost,
                )
            except Exception:
                logger.warning(f"Failed to record credit for job {job_id}", exc_info=True)

            # Check for cancellation after AI call
            await check_cancellation(job_id)

            # Save to project's i2vScript document
            await job_queue_service.update_job_status(job_id, JobStatus.GENERATING, progress=0.8)
            logger.debug(f"[I2V-STORYBOARD] {job_id} - Saving to i2vScript subcollection...")
            await _save_i2v_storyboard(
                job.project_id,
                result,
                job,
                job_id,
            )
            logger.info(f"[I2V-STORYBOARD] {job_id} - i2vScript document updated")

            # Update job with results
            state_machine.transition_to(JobStatus.COMPLETED)
            await job_queue_service.update_job_status(
                job_id,
                JobStatus.COMPLETED,
                progress=1.0,
                storyboard_result=result,
            )

            scene_count = len(result.get("scenes", []))
            clip_count = sum(len(s.get("clips", [])) for s in result.get("scenes", []))

            logger.info(f"[I2V-STORYBOARD] {job_id} ========== JOB COMPLETED SUCCESSFULLY ==========")
            return {
                "job_id": job_id,
                "status": "completed",
                "scene_count": scene_count,
                "clip_count": clip_count,
            }

    except CancellationRequested:
        logger.info(f"[I2V-STORYBOARD] {job_id} - Job was cancelled")
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.CANCELLED,
            progress=0.0,
        )
        return {
            "job_id": job_id,
            "status": "cancelled",
        }

    except Exception as e:
        logger.exception(f"[I2V-STORYBOARD] {job_id} - Error during processing: {e}")

        # Classify the error
        error_info = classify_exception(e)

        # Update job status to failed
        await job_queue_service.update_job_status(
            job_id,
            JobStatus.FAILED,
            error_code=error_info.code.value,
            error_message=str(e),
            error_retryable=error_info.retryable,
        )

        return {
            "job_id": job_id,
            "status": "failed",
            "error": str(e),
            "error_code": error_info.code.value,
            "retryable": error_info.retryable,
        }


def _repair_json(text: str) -> str:
    """Attempt to repair common JSON issues from LLM output."""
    # Remove trailing commas before } or ]
    text = re.sub(r',\s*([}\]])', r'\1', text)
    # Replace single-quoted keys/values with double quotes (naive)
    # Only if the text doesn't already look like valid JSON with double quotes
    # Fix unescaped newlines inside string values
    text = text.replace('\\\n', '\\n')
    # Truncate at the last valid closing brace if JSON is cut off
    last_brace = text.rfind('}')
    if last_brace != -1 and last_brace < len(text) - 1:
        trailing = text[last_brace + 1:].strip()
        if trailing and not trailing.startswith(']') and not trailing.startswith(','):
            text = text[:last_brace + 1]
    return text


async def _generate_i2v_storyboard_with_gemini(
    job: JobDocument,
    api_key: str,
    panel_images: list[bytes],
) -> dict:
    """
    Call Gemini API to generate storyboard from panel images.

    Args:
        job: Job document with all parameters
        api_key: Gemini API key
        panel_images: Downloaded panel image bytes

    Returns:
        dict with scenes and voicePrompts
    """
    client = genai.Client(api_key=api_key)

    # Parse target duration
    total_panels = len(panel_images)
    required_clip_count = _resolve_required_clip_count(job.source_text or '', total_panels)

    # Build conditions
    story_condition = job.story_condition or "원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다."
    image_condition = job.image_condition or "캐릭터의 외형적 특징을 고정한다. 샷의 앵글과 구도는 Background ID의 지침을 따른다."
    video_condition = job.video_condition or "카메라 앵글과 동작 위주로 간결하게 구성한다. 캐릭터 이름 대신 대명사를 사용하세요."
    sound_condition = job.sound_condition or "음향은 대사, 효과음, 배경음악으로 구분한다. 망가 패널의 텍스트가 있는 경우 이를 최우선으로 반영한다."
    image_guide = job.image_guide or "없음"
    video_guide = job.video_guide or "없음"
    source_text = job.source_text or ""
    custom_instruction = job.custom_instruction or ""
    background_instruction = job.background_instruction or ""
    negative_instruction = job.negative_instruction or ""
    video_instruction = job.video_instruction or ""

    # Build multimodal parts: images first, then prompt text
    content_parts: list[types.Part] = []

    # Add all panel images
    for image_bytes in panel_images:
        content_parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))

    # Build the Korean prompt (ported from route.ts)
    source_text_section = (
        f"원본 텍스트:\n---\n{source_text}\n---"
        if source_text
        else "망가 패널 이미지를 기반으로 스토리를 구성하세요."
    )
    prompt = f"""
다음 원본 텍스트와 제공된 망가 패널 이미지들을 기반으로 애니메이션 콘티를 제작해 주세요.

**[CRITICAL: 패널 변환 규칙 — 가장 중요한 규칙]**
제공된 **모든 {total_panels}개의 패널 각각에 대해 반드시 최소 하나의 클립을 생성해야 합니다.** 어떠한 패널도 건너뛰거나 생략해서는 안 됩니다. 런닝타임이나 시간 제한 없이, 총 클립 수는 패널 수 이상이어야 합니다. 클립 수를 임의로 줄이거나 패널을 통합하여 누락시키는 것은 절대 금지입니다.

**[CRITICAL: 정확한 총 클립 수 (절대 준수)]**
원본 텍스트 초반에 명시된 총 출력 클립/패널 수: **{required_clip_count}개**
총 클립 수는 반드시 정확히 **{required_clip_count}개**이어야 합니다. 하나도 더 만들거나 덜 만들어서는 절대 안 됩니다. 패널을 임의로 합치거나 건너뛰어서 클립 수를 줄이는 것은 금지입니다.

**[이미지 패널 활용 및 인물/사물 ID 규칙]**
1. 제공된 이미지들은 망가(만화) 패널들입니다. 총 {total_panels}개의 패널이 제공됩니다 (0-indexed로 referenceImageIndex 사용).
2. 각 이미지에서 캐릭터의 표정, 구도, 대사를 분석하세요.
3. **[반복 요소 및 캐릭터 ID 관리]**:
   - **모든 등장인물 식별**: 한 컷 이상 등장하는 모든 인물(엑스트라 포함)의 이름을 파악하여 고유 CHARACTER_ID를 부여하세요.
   - **의상 버전 관리**: 이벤트나 상황에 따라 캐릭터의 의상이 바뀌는 경우, 버전별로 구분된 ID를 부여하세요 (예: KANIA_BATTLE_ARMOR, KANIA_CASUAL, CHENA_NIGHTGOWN).
   - **ID 형식**: 반드시 모든 문자를 **대문자**로 작성하고, 공백 대신 **언더바(_)**를 사용하세요.
   - 이름이 명시된 경우 이름을 ID로 사용 (KANIA, CHENA).
   - 이름 없는 경우 특징을 요약하여 ID를 생성하세요 (예: VILLAGER_A, TOWN_GUARD_1).
   - 소유물 표현 시 따옴표/어포스트로피 절대 금지 (예: KANIA_SWORD).
   - 모든 필드(`story`, `imagePrompt` 등)에서 이 ID를 일관되게 사용하세요.
4. 분석된 내용을 콘티의 'dialogue', 'sfx', 'imagePrompt' 등에 적극적으로 반영하세요.

**[CRITICAL: 필드별 언어 및 내용 규칙]**
- **story**: 반드시 **한국어**로 작성하세요. 각 클립의 story 필드에는 반드시 다음 정보를 구체적으로 포함하세요: (1) 어떤 장소/상황인지, (2) 누가(CHARACTER_ID), (3) 무슨 행동이나 발화를 했는지. 예: "KANIA가 CHENA를 붙잡으며 멈추라고 외치는 장면", "HERO_A가 홀로 폐허에 서서 주위를 둘러보는 장면". 단순히 '대화', '이동', '표정' 같은 단일 키워드만으로 표현하는 것은 금지합니다.
- **imagePrompt**: 영어로 작성하되, **캐릭터의 의상(clothing)이나 색상(colors)은 절대 묘사하지 마세요.** (ID를 통해 캐릭터 시트에서 관리됨). 오직 구도, 동작, 인물 ID 위주로만 설명하세요.
- **backgroundId**: 반드시 **숫자-숫자[-숫자]** 형식을 유지하세요 (예: 1-1, 4-2).
  - 첫 번째 숫자는 **장소(Location)** 고유 번호입니다. **반드시 1부터 시작**하여 새로운 장소가 나올 때마다 1씩 증가시키세요. 같은 장소라면 항상 같은 첫 번째 숫자를 사용하세요.
  - 두 번째 숫자는 **구도/앵글(Angle)** 번호입니다.
  - **CRITICAL: 동일한 '장소-앵글' 조합이 두 번 이상 등장할 경우, 반드시 세 번째 숫자를 추가하여 각 클립을 고유하게 식별해야 합니다.**
    - 예: 4-2 (첫 번째 등장) -> 4-2-1 (두 번째 등장) -> 4-2-2 (세 번째 등장) 등.
    - **절대 ID가 중복되지 않도록 하세요.** 배경 이미지가 같더라도 샷이 다르면 ID 뒤에 고유 번호를 붙여야 합니다.
- **videoApi**: 비디오 생성 API 추천값을 문자열로 반환하세요. 기본값은 **Grok**이며, 특수한 이유가 없다면 Grok을 사용하세요.

**[CRITICAL: 대사(Dialogue) 형식 규칙]**
- ElevenLabs 감정 반영을 위해: **[감정] 대사내용**
- 감정은 대괄호 [] 안에 한두 단어의 핵심 단어로 요약.
- 예시: [조심스럽게] "여기가 제 방인가요...?", [cautiously] "Is this my room...?"

**[CRITICAL: 클립 길이 규칙]**
- 모든 클립의 길이는 **절대로 4초를 넘을 수 없습니다.**
- 'accumulatedTime' 필드는 각 클립의 누적 시간을 MM:SS 형식으로 기록합니다 (총 시간 제한 없음).

**[CRITICAL: 비디오 프롬프트 규칙]**
- `videoPrompt`에서는 누가 어떤 말을 하는지, speaks / talking / yelling / shouting / whispering 같은 발화 표현을 절대 쓰지 마세요.
- `videoPrompt`에서는 camera movement, tracking shot, pan, tilt, zoom, dolly, handheld, low angle, close-up 등 카메라 움직임/샷 용어를 절대 쓰지 마세요.
- `videoPrompt`에서는 "head stays still", "head angle stays still" 같은 표현을 절대 쓰지 마세요.
- 얼굴이 보이지 않는 패널(Face Present: No)에 대응하는 클립은 특히 발화/입모양/머리 고정 관련 표현을 완전히 제외하세요.
- 대신 인물의 상태, 분위기, 표면 디테일만 간결하게 적으세요.

**[사용자 특별 지시사항 (스토리 흐름)]**
{custom_instruction if custom_instruction else "특별한 지시 없음"}

**[배경 ID 및 카메라 앵글 지시사항]**
{background_instruction if background_instruction else "특별한 지시 없음"}

**[비디오 프롬프트 추가 지시사항]**
{video_instruction if video_instruction else "특별한 지시 없음"}

**[Negative Prompt (절대 금지 사항)]**
{negative_instruction if negative_instruction else "특별한 지시 없음"}
- 위 목록에 명시된 모든 요소는 모든 칼럼에서 무조건 제외하십시오.

각 필드 가이드라인:
- **story**: 규칙: {story_condition}. 반드시 누가 무슨 행동을 했는지, 어떠한 장면인지 구체적으로 서술하세요. (한국어 필수)
- **imagePrompt**: 규칙: {image_condition}. 가이드: {image_guide}. (의상/색상 묘사 금지)
- **videoPrompt**: 규칙: {video_condition}. 가이드: {video_guide}.
- **dialogue/sfx/bgm**: 규칙: {sound_condition}.

{source_text_section}
"""

    content_parts.append(types.Part.from_text(text=prompt))

    # Response schema (includes referenceImageIndex)
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "scenes": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "sceneTitle": {"type": "STRING"},
                        "clips": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "story": {"type": "STRING"},
                                    "imagePrompt": {"type": "STRING"},
                                    "videoPrompt": {"type": "STRING"},
                                    "videoApi": {"type": "STRING"},
                                    "dialogue": {"type": "STRING"},
                                    "dialogueEn": {"type": "STRING"},
                                    "sfx": {"type": "STRING"},
                                    "sfxEn": {"type": "STRING"},
                                    "bgm": {"type": "STRING"},
                                    "bgmEn": {"type": "STRING"},
                                    "length": {"type": "STRING"},
                                    "accumulatedTime": {"type": "STRING"},
                                    "backgroundPrompt": {"type": "STRING"},
                                    "backgroundId": {"type": "STRING"},
                                    "referenceImageIndex": {
                                        "type": "NUMBER",
                                        "description": "0-indexed reference to source panel",
                                    },
                                },
                                "required": [
                                    "story", "imagePrompt", "videoPrompt",
                                    "videoApi",
                                    "dialogue", "dialogueEn",
                                    "sfx", "sfxEn", "bgm", "bgmEn",
                                    "length", "accumulatedTime",
                                    "backgroundPrompt", "backgroundId",
                                    "referenceImageIndex",
                                ],
                            },
                        },
                    },
                    "required": ["sceneTitle", "clips"],
                },
            },
            "voicePrompts": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "promptKo": {"type": "STRING"},
                        "promptEn": {"type": "STRING"},
                    },
                    "required": ["promptKo", "promptEn"],
                },
            },
        },
        "required": ["scenes", "voicePrompts"],
    }

    # Call Gemini with retry logic
    max_retries = 3
    initial_delay = 2000
    delay = initial_delay

    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content(
                model=MODEL_NAME,
                contents=types.Content(
                    parts=content_parts,
                ),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )
            break
        except Exception as e:
            error_msg = str(e)
            if ("503" in error_msg or "overloaded" in error_msg or "UNAVAILABLE" in error_msg or "RESOURCE_EXHAUSTED" in error_msg) and attempt < max_retries - 1:
                logger.warning(f"Attempt {attempt + 1} failed due to model overload. Retrying in {delay}ms...")
                await asyncio.sleep(delay / 1000)
                delay *= 2
            else:
                raise

    response_text = response.text.strip() if response.text else ""
    if not response_text:
        raise ValueError("Empty response from Gemini API")

    # Clean up markdown code blocks if present
    json_text = response_text.replace("```json", "").replace("```", "").strip()

    try:
        result = json.loads(json_text)
    except json.JSONDecodeError as parse_err:
        logger.warning(f"[I2V-STORYBOARD] JSON parse failed: {parse_err}. Attempting repair...")
        repaired = _repair_json(json_text)
        try:
            result = json.loads(repaired)
            logger.info("[I2V-STORYBOARD] JSON repair succeeded")
        except json.JSONDecodeError:
            logger.warning("[I2V-STORYBOARD] JSON repair failed, retrying Gemini call...")
            # One more attempt with the API
            retry_response = await client.aio.models.generate_content(
                model=MODEL_NAME,
                contents=types.Content(parts=content_parts),
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            )
            retry_text = retry_response.text.strip() if retry_response.text else ""
            retry_json = retry_text.replace("```json", "").replace("```", "").strip()
            result = json.loads(retry_json)  # Let it raise if still broken
            logger.info("[I2V-STORYBOARD] Retry succeeded")

    # Post-process: append suffix to all imagePrompts and apply TXT-derived clip metadata
    for scene in result.get("scenes", []):
        for clip in scene.get("clips", []):
            clip["imagePrompt"] = _append_suffix(clip.get("imagePrompt", ""))

    allow_camera_terms, allow_speech_terms = _allows_video_prompt_terms(video_condition, video_instruction)
    result = _apply_panel_metadata_to_result(
        result,
        source_text,
        allow_camera_terms=allow_camera_terms,
        allow_speech_terms=allow_speech_terms,
    )
    result = _enforce_required_clip_count(result, required_clip_count, total_panels)
    result = _normalize_clip_defaults(result, total_panels)
    result = _dedupe_background_ids(result)
    result = _apply_panel_label_fallback(result, job.panel_labels or [])
    result = _ensure_story_quality(result)
    result = _apply_grouped_story_labels(result)

    return result


async def _save_i2v_storyboard(
    project_id: str,
    result: dict,
    job: JobDocument,
    job_id: str,
) -> None:
    """
    Save I2V storyboard results to Firestore.

    Args:
        project_id: The project ID
        result: Storyboard generation result
        job: The job document (for metadata)
        job_id: The job ID
    """
    from app.services.firestore import get_i2v_script_service

    i2v_script_service = get_i2v_script_service()

    # Build metadata from job fields
    metadata = {
        "targetDuration": job.target_duration or "03:00",
        "sourceText": job.source_text or "",
        "storyCondition": job.story_condition or "",
        "imageCondition": job.image_condition or "",
        "videoCondition": job.video_condition or "",
        "soundCondition": job.sound_condition or "",
    }

    await i2v_script_service.save_i2v_storyboard(
        project_id=project_id,
        scenes=result.get("scenes", []),
        voice_prompts=result.get("voicePrompts", []),
        metadata=metadata,
        job_id=job_id,
    )
