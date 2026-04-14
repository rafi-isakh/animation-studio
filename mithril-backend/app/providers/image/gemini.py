"""Gemini image generation provider using google-genai SDK."""

import asyncio
import base64
import logging
from typing import Any

from google import genai
from google.genai import types

from app.providers.image.base import (
    ImageGenerateRequest,
    ImageProvider,
    ImageProviderConstraints,
)

logger = logging.getLogger(__name__)

# Limit concurrent Gemini API calls per worker to avoid rate-limit errors
_GEMINI_SEMAPHORE = asyncio.Semaphore(5)

# Gemini image constraints
GEMINI_IMAGE_CONSTRAINTS = ImageProviderConstraints(
    aspect_ratios=["16:9", "9:16", "1:1"],
    max_reference_images=10,
    supports_reference_images=True,
)


def _handle_common_errors(error: Exception) -> None:
    """Handle common API errors and re-raise with clearer messages."""
    error_msg = str(error)

    if "INVALID_ARGUMENT" in error_msg:
        raise ValueError("The API rejected the request. Check prompt or image format.")
    if "Internal error" in error_msg or "500" in error_msg:
        raise RuntimeError("Google AI Service Internal Error. Please try again later.")
    if "rate limit" in error_msg.lower() or "429" in error_msg:
        raise RuntimeError("Rate limit exceeded. Please try again later.")
    if "quota" in error_msg.lower() or "402" in error_msg:
        raise RuntimeError("Quota exceeded. Please check your API usage.")

    raise RuntimeError(f"Generation failed: {error_msg}")


class GeminiImageProvider(ImageProvider):
    """Google Gemini image generation provider."""

    @property
    def id(self) -> str:
        return "gemini"

    @property
    def name(self) -> str:
        return "Gemini Image"

    @property
    def description(self) -> str:
        return "Google's Gemini image generation model with reference image support"

    @property
    def model_name(self) -> str:
        return "gemini-3-pro-image-preview"

    @property
    def fallback_model_name(self) -> str:
        return "imagen-3.0-generate-001"

    def get_constraints(self) -> ImageProviderConstraints:
        return GEMINI_IMAGE_CONSTRAINTS

    async def generate_image(
        self,
        request: ImageGenerateRequest,
        api_key: str,
    ) -> bytes:
        """
        Generate an image using Gemini API.

        Primary model: gemini-3-pro-image-preview (supports reference images)
        Fallback: imagen-3.0-generate-001 (text-only, if primary fails with 403/404)

        Args:
            request: Image generation request
            api_key: Gemini API key

        Returns:
            Image bytes (PNG)
        """
        validation_error = self.validate_request(request)
        if validation_error:
            raise ValueError(validation_error)

        # Build the full prompt
        full_prompt = ""
        if request.style_prompt:
            full_prompt += f"STYLE: {request.style_prompt.strip()}\n"
        full_prompt += request.prompt.strip()

        logger.info(f"[GEMINI-IMAGE] ========== Generating image ==========")
        logger.info(f"[GEMINI-IMAGE] Full prompt ({len(full_prompt)} chars): {full_prompt[:200]}...")
        logger.info(f"[GEMINI-IMAGE] Aspect ratio: {request.aspect_ratio}")
        logger.info(f"[GEMINI-IMAGE] Reference images: {len(request.reference_images)}")

        # Initialize the SDK client
        logger.debug(f"[GEMINI-IMAGE] Initializing Gemini client with API key")
        client = genai.Client(api_key=api_key)
        logger.debug(f"[GEMINI-IMAGE] Client initialized")

        # Build parts array
        parts: list[Any] = []

        # Add text prompt
        parts.append(types.Part.from_text(text=full_prompt))
        logger.debug(f"[GEMINI-IMAGE] Added text prompt part")

        # Add reference images
        has_reference_images = len(request.reference_images) > 0
        if has_reference_images:
            logger.info(f"[GEMINI-IMAGE] Processing {len(request.reference_images)} reference images...")

        for i, img_bytes in enumerate(request.reference_images):
            # Determine MIME type (assume JPEG for now, could be improved)
            mime_type = "image/jpeg"
            if img_bytes[:8] == b'\x89PNG\r\n\x1a\n':
                mime_type = "image/png"
            elif img_bytes[:4] == b'RIFF' and img_bytes[8:12] == b'WEBP':
                mime_type = "image/webp"

            # Convert bytes to base64 for inline data
            img_base64 = base64.b64encode(img_bytes).decode("utf-8")

            parts.append(
                types.Part.from_bytes(
                    data=img_bytes,
                    mime_type=mime_type,
                )
            )
            logger.info(f"[GEMINI-IMAGE] ✓ Added reference image {i+1}/{len(request.reference_images)}: {mime_type}, {len(img_bytes)} bytes")

        logger.info(f"[GEMINI-IMAGE] Total parts built: {len(parts)} (1 text + {len(request.reference_images)} images)")

        try:
            # Primary attempt: gemini-3-pro-image-preview
            # This model supports both text-to-image and image-to-image (editing)
            logger.info(f"[GEMINI-IMAGE] Calling Gemini API with model: {self.model_name}")
            logger.debug(f"[GEMINI-IMAGE] Config: response_modalities=['IMAGE'], aspect_ratio={request.aspect_ratio}")

            def _generate():
                return client.models.generate_content(
                    model=self.model_name,
                    contents=types.Content(
                        role="user",
                        parts=parts,
                    ),
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        image_config=types.ImageConfig(
                            aspect_ratio=request.aspect_ratio,
                        ),
                    ),
                )

            logger.debug(f"[GEMINI-IMAGE] Executing API call...")
            async with _GEMINI_SEMAPHORE:
                response = await asyncio.to_thread(_generate)
            logger.info(f"[GEMINI-IMAGE] ✓ API call completed")

            # Extract image from response
            logger.debug(f"[GEMINI-IMAGE] Parsing response, candidates: {len(response.candidates) if response.candidates else 0}")
            if response.candidates:
                candidate = response.candidates[0]
                logger.debug(f"[GEMINI-IMAGE] Candidate has content: {bool(candidate.content)}")
                if candidate.content and candidate.content.parts:
                    logger.debug(f"[GEMINI-IMAGE] Content has {len(candidate.content.parts)} parts")
                    for idx, part in enumerate(candidate.content.parts):
                        logger.debug(f"[GEMINI-IMAGE] Part {idx}: has_inline_data={hasattr(part, 'inline_data')}")
                        if hasattr(part, "inline_data") and part.inline_data:
                            image_bytes = part.inline_data.data
                            if image_bytes:
                                logger.info(f"[GEMINI-IMAGE] ✓✓✓ Image extracted successfully: {len(image_bytes)} bytes")
                                return image_bytes

            # Check for blocking reasons
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                logger.error(f"[GEMINI-IMAGE] Request blocked: {response.prompt_feedback.block_reason}")
                raise ValueError(f"Request blocked: {response.prompt_feedback.block_reason}")

            # Check if model returned text instead of image
            if hasattr(response, "text") and response.text:
                logger.error(f"[GEMINI-IMAGE] Model returned text instead of image: {response.text[:100]}")
                raise ValueError(f"Model returned text instead of image: {response.text[:100]}")

            logger.error(f"[GEMINI-IMAGE] No image data found in response")
            raise RuntimeError("No image returned from gemini-3-pro-image-preview")

        except Exception as e:
            error_msg = str(e)
            logger.error(f"[GEMINI-IMAGE] ✗✗✗ Primary model error: {type(e).__name__}: {error_msg}")

            # Parse API error code
            error_code = None
            if "403" in error_msg or "PERMISSION_DENIED" in error_msg:
                error_code = 403
            elif "404" in error_msg or "NOT_FOUND" in error_msg:
                error_code = 404

            # Fallback: If Permission Denied (403) or Not Found (404)
            if error_code in (403, 404):
                # If we have reference images, we cannot use Imagen 3 fallback
                if has_reference_images:
                    raise ValueError(
                        f"Access Denied to '{self.model_name}'. "
                        f"This model is required for Image-to-Image features (character/background references). "
                        f"Please try clearing your reference images to use the text-only fallback model."
                    )

                logger.warning(
                    f"[GEMINI-IMAGE] Primary model failed with permission error. "
                    f"Attempting fallback to Imagen 3..."
                )

                try:
                    # Fallback: imagen-3.0-generate-001
                    logger.info(f"[GEMINI-IMAGE] Calling fallback model: {self.fallback_model_name}")
                    def _generate_fallback():
                        return client.models.generate_images(
                            model=self.fallback_model_name,
                            prompt=full_prompt,
                            config=types.GenerateImagesConfig(
                                number_of_images=1,
                                aspect_ratio=request.aspect_ratio,
                                output_mime_type="image/png",
                            ),
                        )

                    fallback_response = await asyncio.to_thread(_generate_fallback)
                    logger.info(f"[GEMINI-IMAGE] ✓ Fallback API call completed")

                    if (
                        fallback_response.generated_images
                        and fallback_response.generated_images[0].image
                    ):
                        image_bytes = fallback_response.generated_images[0].image.image_bytes
                        if image_bytes:
                            logger.info(f"[GEMINI-IMAGE] ✓✓✓ Fallback generated image: {len(image_bytes)} bytes")
                            return image_bytes

                    logger.error(f"[GEMINI-IMAGE] Fallback model did not return an image")
                    raise RuntimeError("Fallback model (Imagen 3) did not return an image.")

                except Exception as fallback_error:
                    logger.error(f"[GEMINI-IMAGE] ✗✗✗ Fallback failed: {type(fallback_error).__name__}: {fallback_error}")
                    raise RuntimeError(
                        f"Failed to generate image. Primary model denied access, "
                        f"and fallback model failed: {fallback_error}"
                    )

            # Re-throw other errors
            _handle_common_errors(e)
            raise


# Create singleton instance
gemini_image_provider = GeminiImageProvider()
