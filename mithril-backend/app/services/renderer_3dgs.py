"""
3D Gaussian Splatting renderer (CPU).

Implements EWA splatting: projects each Gaussian to a 2D ellipse and
alpha-composites them back-to-front (standard "over" operator).

Supported input formats:
  - INRIA .ply  (PLY header starts with ASCII "ply")
  - Niantic .spz (gzip-compressed binary, magic bytes "NGSP")

Performance: ~20-60 s for 200K Gaussians on a modern CPU.
Tune max_gaussians down for faster previews.
"""

import io
import logging
import math
import os
import tempfile

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

MAX_MODEL_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB

# SH DC coefficient: color = 0.5 + C0 * f_dc
_SH_C0 = 0.28209479177387814


# ---------------------------------------------------------------------------
# Camera helpers (duplicated from renderer_3d to keep modules independent)
# ---------------------------------------------------------------------------

def _look_at_pose(eye: np.ndarray, target: np.ndarray, tilt_deg: float = 0.0) -> np.ndarray:
    """
    Camera-to-world 4×4 matrix in COLMAP/OpenCV convention:
      +X  right,  +Y  down (image Y),  +Z  forward into scene.
    This matches the projection math in _project_gaussians (positive z = in front).
    """
    forward = target - eye
    norm = np.linalg.norm(forward)
    forward = forward / norm if norm > 1e-8 else np.array([0.0, 0.0, 1.0])

    world_up = np.array([0.0, 1.0, 0.0])
    # COLMAP: right = world_up × forward  (NOT forward × world_up — that gives left)
    right = np.cross(world_up, forward)
    if np.linalg.norm(right) < 1e-6:
        world_up = np.array([0.0, 0.0, 1.0])
        right = np.cross(world_up, forward)
    right /= np.linalg.norm(right)
    # COLMAP: camera Y points down → down = right × forward gives [0,-1,0] when Y-up world
    down = np.cross(right, forward)
    down /= np.linalg.norm(down)

    if abs(tilt_deg) > 0.01:
        t = math.radians(tilt_deg)
        ct, st = math.cos(t), math.sin(t)
        right, down = ct * right + st * down, -st * right + ct * down
        right /= np.linalg.norm(right)
        down /= np.linalg.norm(down)

    pose = np.eye(4, dtype=np.float64)
    pose[:3, 0] = right
    pose[:3, 1] = down     # COLMAP: Y is down
    pose[:3, 2] = forward  # COLMAP: Z is forward
    pose[:3, 3] = eye
    return pose


# ---------------------------------------------------------------------------
# PLY loader
# ---------------------------------------------------------------------------

def _load_3dgs_ply(data: bytes) -> dict:
    """
    Load a 3DGS .ply file and return a dict of numpy arrays:
      means      [N, 3]  — Gaussian centres (xyz)
      scales     [N, 3]  — axis scales (exp of stored log-scales)
      rots       [N, 4]  — quaternions (w, x, y, z), normalised
      opacities  [N]     — [0, 1] (sigmoid of stored logit)
      colors     [N, 3]  — base RGB [0, 1] from SH DC coefficient
    """
    from plyfile import PlyData

    with tempfile.NamedTemporaryFile(suffix=".ply", delete=False) as f:
        f.write(data)
        tmp_path = f.name
    try:
        plydata = PlyData.read(tmp_path)
    finally:
        os.unlink(tmp_path)

    v = plydata["vertex"]
    names = set(v.data.dtype.names)

    def _col(key):
        return np.asarray(v[key], dtype=np.float32)

    # Positions
    means = np.stack([_col("x"), _col("y"), _col("z")], axis=1)

    # Scales
    if {"scale_0", "scale_1", "scale_2"} <= names:
        scales = np.exp(np.stack([_col("scale_0"), _col("scale_1"), _col("scale_2")], axis=1))
    else:
        scales = np.full((len(means), 3), 0.01, dtype=np.float32)

    # Rotations (w, x, y, z)
    if {"rot_0", "rot_1", "rot_2", "rot_3"} <= names:
        rots = np.stack([_col("rot_0"), _col("rot_1"), _col("rot_2"), _col("rot_3")], axis=1)
        norms = np.linalg.norm(rots, axis=1, keepdims=True)
        rots /= np.maximum(norms, 1e-8)
    else:
        rots = np.zeros((len(means), 4), dtype=np.float32)
        rots[:, 0] = 1.0  # identity

    # Opacities
    if "opacity" in names:
        opacities = 1.0 / (1.0 + np.exp(-_col("opacity")))
    else:
        opacities = np.full(len(means), 0.5, dtype=np.float32)

    # Base colors from SH DC
    if {"f_dc_0", "f_dc_1", "f_dc_2"} <= names:
        f_dc = np.stack([_col("f_dc_0"), _col("f_dc_1"), _col("f_dc_2")], axis=1)
        colors = np.clip(0.5 + _SH_C0 * f_dc, 0.0, 1.0)
    else:
        colors = np.full((len(means), 3), 0.5, dtype=np.float32)

    logger.info(f"[3DGS] Loaded {len(means):,} Gaussians from .ply")
    return {
        "means": means,
        "scales": scales,
        "rots": rots,
        "opacities": opacities,
        "colors": colors,
    }


# ---------------------------------------------------------------------------
# Non-PLY format loader via GaussForge
# ---------------------------------------------------------------------------

_GZIP_MAGIC = b"\x1f\x8b"
_SPZ_MAGIC = b"NGSP"   # uint32 LE 0x5053474e


def _convert_to_ply(data: bytes, src_fmt: str) -> bytes:
    """Use gaussforge to convert SPZ / SPLAT / KSPLAT / SOG → PLY bytes."""
    import gaussforge
    gf = gaussforge.GaussForge()

    # Try convert() first; fall back to read()+write() if result is wrong
    result = gf.convert(data, src_fmt, "ply")
    if "error" in result:
        raise ValueError(f"gaussforge convert() failed: {result['error']}")

    ply_bytes = result.get("data", b"")
    logger.info(
        f"[3DGS] gaussforge convert result keys={list(result.keys())} "
        f"data_len={len(ply_bytes)} first_bytes={ply_bytes[:8].hex() if ply_bytes else 'n/a'}"
    )

    # If the output doesn't look like a PLY file, try the read()+write() path
    if not ply_bytes or not ply_bytes[:3] == b"ply":
        logger.info("[3DGS] convert() didn't return PLY, trying read()+write()")
        ir = gf.read(data, src_fmt)
        logger.info(f"[3DGS] gaussforge read() result keys={list(ir.keys()) if isinstance(ir, dict) else type(ir)}")
        write_result = gf.write(ir, "ply")
        if isinstance(write_result, dict):
            ply_bytes = write_result.get("data", b"")
        else:
            ply_bytes = write_result
        logger.info(f"[3DGS] gaussforge write() output: len={len(ply_bytes)} first_bytes={ply_bytes[:8].hex() if ply_bytes else 'n/a'}")

    if not ply_bytes or not ply_bytes[:3] == b"ply":
        raise ValueError(
            f"gaussforge did not produce valid PLY output. "
            f"First bytes: {ply_bytes[:8].hex() if ply_bytes else 'empty'}"
        )

    logger.info(f"[3DGS] gaussforge converted {src_fmt} → PLY ({len(ply_bytes):,} bytes)")
    return ply_bytes


def _load_gaussians(data: bytes) -> dict:
    """
    Auto-detect format from magic bytes and load accordingly.

    PLY files are loaded directly; everything else is converted via gaussforge.

    Supported magic signatures:
      b'ply'  → INRIA PLY (direct)
      b'NGSP' → Niantic SPZ raw payload (via gaussforge)
      b'\\x1f\\x8b' → gzip-wrapped SPZ — the gzip IS part of the SPZ format,
                      passed directly to gaussforge without pre-decompressing
    """
    if data[:3] == b"ply":
        return _load_3dgs_ply(data)

    if data[:4] == _SPZ_MAGIC or data[:2] == _GZIP_MAGIC:
        logger.info(f"[3DGS] Detected SPZ (first bytes: {data[:4].hex()}) — converting via gaussforge")
        ply_bytes = _convert_to_ply(data, "spz")
        return _load_3dgs_ply(ply_bytes)

    raise ValueError(
        f"Unknown 3DGS format. Expected PLY ('ply') or SPZ ('NGSP' / gzip). "
        f"Got first bytes: {data[:8].hex()}"
    )


# ---------------------------------------------------------------------------
# Projection + culling
# ---------------------------------------------------------------------------

def _project_gaussians(
    gaussians: dict,
    view_mat: np.ndarray,  # 4×4 world-to-camera
    fx: float,
    fy: float,
    cx: float,
    cy: float,
    width: int,
    height: int,
    znear: float = 0.1,
) -> tuple:
    """
    Project all Gaussians to 2D using screen-space radius (no 3D covariance rotation).

    Screen-space radius = fx * max_scale / z, capped at 256 px.
    This avoids the full EWA covariance pipeline while remaining visually correct.

    Returns (means2d, screen_radii, colors, opacities, depths, mask).
    """
    means = gaussians["means"]          # [N, 3]
    scales = gaussians["scales"]        # [N, 3]  already exp'd
    colors = gaussians["colors"]        # [N, 3]
    opacities = gaussians["opacities"]  # [N]

    N = len(means)
    ones = np.ones((N, 1), dtype=np.float32)
    means_h = np.concatenate([means, ones], axis=1)  # [N, 4]
    means_cam = (view_mat @ means_h.T).T             # [N, 4]

    x_cam = means_cam[:, 0]
    y_cam = means_cam[:, 1]
    z_cam = means_cam[:, 2]

    # In front of camera and non-trivial opacity
    mask = (z_cam > znear) & (opacities > 0.004)

    z_safe = np.maximum(z_cam, znear)

    # Perspective projection → pixel coordinates
    px = fx * x_cam / z_safe + cx
    py = fy * y_cam / z_safe + cy

    margin = 64
    mask &= (px > -margin) & (px < width + margin)
    mask &= (py > -margin) & (py < height + margin)

    means2d = np.stack([px, py], axis=1)  # [N, 2]

    # Screen-space radius from largest 3D scale
    max_scale = scales.max(axis=1)  # [N]
    screen_r = np.clip(fx * max_scale / z_safe, 0.5, 256.0).astype(np.float32)

    return means2d, screen_r, colors, opacities, z_cam, mask


# ---------------------------------------------------------------------------
# Rasterizer
# ---------------------------------------------------------------------------

def _rasterize(
    means2d: np.ndarray,      # [M, 2]
    screen_radii: np.ndarray, # [M] screen-space σ in pixels
    colors: np.ndarray,       # [M, 3]
    opacities: np.ndarray,    # [M]
    depths: np.ndarray,       # [M]
    width: int,
    height: int,
    max_gaussians: int,
) -> np.ndarray:
    """Back-to-front alpha compositing of isotropic screen-space Gaussians.
    Returns RGB uint8 [H, W, 3]."""

    # Sort back-to-front then cap
    order = np.argsort(-depths)[:max_gaussians]

    m2d = means2d[order]
    sr  = screen_radii[order]
    col = colors[order]
    opa = opacities[order]

    img = np.zeros((height, width, 3), dtype=np.float32)
    alpha_acc = np.zeros((height, width), dtype=np.float32)

    n_rendered = len(order)
    logger.info(f"[3DGS] Rasterizing {n_rendered:,} Gaussians…")

    for i in range(n_rendered):
        # Early exit once the image is nearly fully opaque
        if alpha_acc.min() > 0.9995:
            break

        gx, gy = m2d[i]
        r = float(sr[i])
        color = col[i]
        alpha = float(opa[i])

        radius_px = int(math.ceil(3.0 * r)) + 1

        x0 = max(0, int(gx) - radius_px)
        x1 = min(width, int(gx) + radius_px + 1)
        y0 = max(0, int(gy) - radius_px)
        y1 = min(height, int(gy) + radius_px + 1)
        if x0 >= x1 or y0 >= y1:
            continue

        # Isotropic Gaussian with σ = r
        xs = np.arange(x0, x1, dtype=np.float32) - gx
        ys = np.arange(y0, y1, dtype=np.float32) - gy
        xx, yy = np.meshgrid(xs, ys, indexing="xy")
        g = np.exp(-0.5 * (xx * xx + yy * yy) / (r * r))

        # "Over" compositing
        remaining = 1.0 - alpha_acc[y0:y1, x0:x1]
        contrib = alpha * g * remaining

        img[y0:y1, x0:x1] += contrib[:, :, np.newaxis] * color
        alpha_acc[y0:y1, x0:x1] += contrib

    # Composite over white background
    remaining = np.clip(1.0 - alpha_acc[:, :, np.newaxis], 0.0, 1.0)
    final = np.clip(img + remaining, 0.0, 1.0)
    return (final * 255).astype(np.uint8)


# ---------------------------------------------------------------------------
# Public API — same signature as renderer_3d.render_single_view
# ---------------------------------------------------------------------------

async def render_single_view_3dgs(
    model_data: bytes,
    azimuth: float = 0.0,
    elevation: float = 30.0,
    distance_multiplier: float = 2.5,
    fov: float = 45.0,
    resolution: tuple = (1920, 1080),
    camera_mode: str = "exterior",
    tilt: float = 0.0,
    interior_offset_x: float = 0.0,
    interior_offset_y: float = 0.0,
    interior_offset_z: float = 0.0,
    max_gaussians: int = 200_000,
) -> bytes:
    """
    Render a single camera view of a 3DGS .ply model.

    Args:
        model_data: Raw bytes of the .ply file.
        azimuth: Horizontal look angle in degrees (0-360).
        elevation: Vertical look angle in degrees (-90 to 90).
        distance_multiplier: Orbit radius as multiple of scene extent (exterior only).
        fov: Vertical field of view in degrees.
        resolution: (width, height).
        camera_mode: "exterior" or "interior".
        tilt: Camera roll in degrees (Dutch angle).
        interior_offset_x/y/z: Camera offset from centre as fraction of half-extent (interior only).
        max_gaussians: Cap on rendered Gaussians. Lower = faster preview.

    Returns:
        PNG image bytes.
    """
    if len(model_data) > MAX_MODEL_SIZE_BYTES:
        raise ValueError(f"Model too large ({len(model_data):,} bytes). Max: {MAX_MODEL_SIZE_BYTES:,}")

    gaussians = _load_gaussians(model_data)

    means = gaussians["means"]
    bbox_min = means.min(axis=0)
    bbox_max = means.max(axis=0)
    center = ((bbox_min + bbox_max) / 2.0).astype(np.float64)
    extents = (bbox_max - bbox_min).astype(np.float64)
    max_extent = float(np.max(extents))

    logger.info(f"[3DGS] Scene centre={center}, extents={extents}")

    # Build camera pose
    az = math.radians(azimuth)
    el = math.radians(elevation)

    if camera_mode == "interior":
        half = extents / 2.0
        eye = center + np.array([
            interior_offset_x * half[0],
            interior_offset_y * half[1],
            interior_offset_z * half[2],
        ])
        look_dir = np.array([math.cos(el) * math.cos(az), math.sin(el), math.cos(el) * math.sin(az)])
        target = eye + look_dir * max_extent
    else:
        radius = max_extent * distance_multiplier
        eye = center + radius * np.array([
            math.cos(el) * math.cos(az),
            math.sin(el),
            math.cos(el) * math.sin(az),
        ])
        target = center

    pose = _look_at_pose(eye, target, tilt)               # camera-to-world
    view_mat = np.linalg.inv(pose).astype(np.float32)     # world-to-camera

    width, height = resolution
    fov_rad = math.radians(fov)
    fx = width / (2.0 * math.tan(fov_rad / 2.0))
    fy = height / (2.0 * math.tan(fov_rad / 2.0))

    means2d, screen_radii, colors, opacities, depths, mask = _project_gaussians(
        gaussians, view_mat, fx, fy, width / 2.0, height / 2.0, width, height,
    )

    n_valid = mask.sum()
    logger.info(f"[3DGS] {n_valid:,} / {len(mask):,} Gaussians visible")

    img_array = _rasterize(
        means2d[mask], screen_radii[mask], colors[mask], opacities[mask], depths[mask],
        width, height, max_gaussians,
    )

    img = Image.fromarray(img_array, "RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    logger.info(f"[3DGS] Render complete: {len(buf.getvalue()):,} bytes")
    return buf.getvalue()
