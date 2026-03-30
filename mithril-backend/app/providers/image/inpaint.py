"""Gemini-based inpaint image editing."""

import base64

import httpx


async def generate_inpaint_panel(
    source_url: str,
    mask_base64: str,
    prompt: str,
    api_key: str,
) -> bytes:
    """
    Generate an inpainted panel image using Gemini's image generation API.

    Passes source image and mask directly as bytes — no S3 URL required for the mask.

    Args:
        source_url: Public URL of the source image.
        mask_base64: Base64-encoded mask image (white = inpaint area, black = keep).
        prompt: Description of desired content in the masked area.
        api_key: Gemini API key.

    Returns:
        Generated image as raw bytes.
    """
    from google import genai
    from google.genai import types

    async with httpx.AsyncClient(timeout=60.0) as http:
        resp = await http.get(source_url)
        resp.raise_for_status()
        image_bytes = resp.content

    mask_bytes = base64.b64decode(mask_base64)

    client = genai.Client(api_key=api_key)

    # Wrap the user prompt so Gemini understands the mask defines the edit region.
    # Without this, property-only prompts like "make it red" have no spatial anchor
    # and the model ignores the mask entirely.
    augmented_prompt = (
        "The second image is a black-and-white mask. "
        "White pixels mark the region to edit; black pixels must remain unchanged. "
        f"Apply the following change ONLY to the white masked region: {prompt}"
    )

    contents = [
        types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
        types.Part.from_bytes(data=mask_bytes, mime_type="image/png"),
        types.Part.from_text(text=augmented_prompt),
    ]

    config = types.GenerateContentConfig(
        response_modalities=["IMAGE", "TEXT"],
    )

    response = await client.aio.models.generate_content(
        model="gemini-3.1-flash-image-preview",
        contents=contents,
        config=config,
    )

    if (
        response.candidates
        and response.candidates[0].content
        and response.candidates[0].content.parts
    ):
        for part in response.candidates[0].content.parts:
            if part.inline_data and part.inline_data.data:
                return part.inline_data.data

    raise RuntimeError(f"No image data in Gemini inpaint response: {response}")