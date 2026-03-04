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

import gzip
import io
import logging
import math
import os
import struct
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
    """Camera-to-world 4×4 matrix (−Z forward, +Y up)."""
    forward = target - eye
    norm = np.linalg.norm(forward)
    forward = forward / norm if norm > 1e-8 else np.array([0.0, 0.0, -1.0])

    world_up = np.array([0.0, 1.0, 0.0])
    right = np.cross(forward, world_up)
    if np.linalg.norm(right) < 1e-6:
        world_up = np.array([0.0, 0.0, 1.0])
        right = np.cross(forward, world_up)
    right /= np.linalg.norm(right)
    up = np.cross(right, forward)
    up /= np.linalg.norm(up)

    if abs(tilt_deg) > 0.01:
        t = math.radians(tilt_deg)
        ct, st = math.cos(t), math.sin(t)
        right, up = ct * right + st * up, -st * right + ct * up
        right /= np.linalg.norm(right)
        up /= np.linalg.norm(up)

    pose = np.eye(4, dtype=np.float64)
    pose[:3, 0] = right
    pose[:3, 1] = up
    pose[:3, 2] = -forward
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
# SPZ loader  (Niantic compressed format)
# ---------------------------------------------------------------------------

# Magic bytes: uint32 LE 0x5053474e → bytes [0x4e, 0x47, 0x53, 0x50] = "NGSP"
_SPZ_MAGIC = b"NGSP"


def _load_spz(data: bytes) -> dict:
    """
    Load a Niantic .spz file.

    File layout:
      - 16-byte header: magic(4) + version(4) + numPoints(4) + shDegree(1)
                        + fractionalBits(1) + flags(1) + reserved(1)
      - rest: gzip-compressed SoA payload

    Payload (decompressed), all uint8 unless noted:
      positions  : N × 3 × 3 bytes  (24-bit little-endian signed fixed-point)
      alphas     : N bytes           (logit_opacity = (v − 128) / 10.5)
      colors     : N × n_sh_coeffs × 3 bytes  (SH DC first; f_dc = (v − 128) / 127.5)
      scales     : N × 3 bytes       (log_scale = v / 255 × 20 − 10)
      rotations  : N × 3 bytes       (xyz of unit quaternion; w = √(1−x²−y²−z²))
    """
    if len(data) < 16:
        raise ValueError("File too small to be a valid SPZ")

    magic = data[:4]
    if magic != _SPZ_MAGIC:
        raise ValueError(f"Not an SPZ file (magic={magic!r}, expected {_SPZ_MAGIC!r})")

    version = struct.unpack_from("<I", data, 4)[0]
    num_points = struct.unpack_from("<I", data, 8)[0]
    sh_degree = data[12]
    frac_bits = data[13]
    # data[14] = flags, data[15] = reserved

    logger.info(f"[3DGS] SPZ header: version={version} numPoints={num_points:,} shDegree={sh_degree} fracBits={frac_bits}")

    raw_payload = data[16:]
    try:
        payload = gzip.decompress(raw_payload)
        logger.info(f"[3DGS] SPZ payload decompressed: {len(payload):,} bytes")
    except Exception:
        # Some SPZ files wrap the NGSP header+payload in gzip (decompressed by the
        # caller), so the inner payload is already raw binary.
        logger.info(f"[3DGS] SPZ payload is raw binary: {len(raw_payload):,} bytes")
        payload = raw_payload

    N = num_points
    n_sh_coeffs = (sh_degree + 1) ** 2
    off = 0

    # --- Positions: N × 3 × 3 bytes (24-bit LE signed fixed-point) ---
    nbytes = N * 3 * 3
    raw = np.frombuffer(payload[off: off + nbytes], dtype=np.uint8).reshape(N, 3, 3)
    off += nbytes

    # Combine 3 bytes into int32, then sign-extend from 24 bits
    vals = (raw[:, :, 0].astype(np.int32)
            | (raw[:, :, 1].astype(np.int32) << 8)
            | (raw[:, :, 2].astype(np.int32) << 16))
    vals = np.where(vals >= (1 << 23), vals - (1 << 24), vals)
    means = (vals / float(1 << frac_bits)).astype(np.float32)

    # --- Alphas: N bytes ---
    alpha_raw = np.frombuffer(payload[off: off + N], dtype=np.uint8).astype(np.float32)
    off += N
    logit_opacity = (alpha_raw - 128.0) / 10.5
    opacities = (1.0 / (1.0 + np.exp(-logit_opacity))).astype(np.float32)

    # --- Colors: N × n_sh_coeffs × 3 bytes (SoA: DC band first) ---
    nbytes = N * n_sh_coeffs * 3
    color_raw = np.frombuffer(payload[off: off + nbytes], dtype=np.uint8).reshape(N, n_sh_coeffs, 3)
    off += nbytes
    # Only DC (index 0) needed for rendering base color
    f_dc = ((color_raw[:, 0, :].astype(np.float32) - 128.0) / 127.5)
    colors = np.clip(0.5 + _SH_C0 * f_dc, 0.0, 1.0).astype(np.float32)

    # --- Scales: N × 3 bytes ---
    scale_raw = np.frombuffer(payload[off: off + N * 3], dtype=np.uint8).reshape(N, 3).astype(np.float32)
    off += N * 3
    scales = np.exp(scale_raw / 255.0 * 20.0 - 10.0).astype(np.float32)

    # --- Rotations: N × 3 bytes (xyz components; w derived) ---
    rot_raw = np.frombuffer(payload[off: off + N * 3], dtype=np.uint8).reshape(N, 3).astype(np.float32)
    xyz = (rot_raw - 128.0) / 127.5
    x, y, z = xyz[:, 0], xyz[:, 1], xyz[:, 2]
    w = np.sqrt(np.maximum(0.0, 1.0 - x ** 2 - y ** 2 - z ** 2)).astype(np.float32)
    rots = np.stack([w, x, y, z], axis=1).astype(np.float32)
    norms = np.linalg.norm(rots, axis=1, keepdims=True)
    rots /= np.maximum(norms, 1e-8)

    logger.info(f"[3DGS] Loaded {N:,} Gaussians from SPZ")
    return {
        "means": means,
        "scales": scales,
        "rots": rots,
        "opacities": opacities,
        "colors": colors,
    }


_GZIP_MAGIC = b"\x1f\x8b"


def _load_gaussians(data: bytes) -> dict:
    """
    Auto-detect format from magic bytes and load accordingly.

    Supported:
      NGSP (Niantic SPZ with header)  → _load_spz
      ply  (INRIA PLY ASCII header)   → _load_3dgs_ply
      1f8b (raw gzip stream)          → decompress, then re-detect above
    """
    if data[:4] == _SPZ_MAGIC:
        return _load_spz(data)
    if data[:3] == b"ply":
        return _load_3dgs_ply(data)
    if data[:2] == _GZIP_MAGIC:
        # Raw gzip stream — decompress and re-try (e.g. gzip-compressed PLY)
        try:
            inner = gzip.decompress(data)
        except Exception as e:
            raise ValueError(f"Failed to decompress gzip stream: {e}")
        if inner[:3] == b"ply":
            logger.info("[3DGS] Detected gzip-compressed PLY")
            return _load_3dgs_ply(inner)
        if inner[:4] == _SPZ_MAGIC:
            logger.info("[3DGS] Detected gzip-compressed SPZ payload")
            return _load_spz(inner)
        raise ValueError(
            f"Decompressed gzip but inner format is unknown. "
            f"First bytes after decompression: {inner[:8].hex()}"
        )
    raise ValueError(
        f"Unknown 3DGS format. Expected PLY ('ply'), SPZ ('NGSP'), or gzip ('1f8b'). "
        f"Got first bytes: {data[:8].hex()}"
    )


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def _quat_to_rotmat(q: np.ndarray) -> np.ndarray:
    """q: [N, 4] wxyz → [N, 3, 3]"""
    w, x, y, z = q[:, 0], q[:, 1], q[:, 2], q[:, 3]
    R = np.empty((len(q), 3, 3), dtype=np.float32)
    R[:, 0, 0] = 1 - 2 * (y * y + z * z)
    R[:, 0, 1] = 2 * (x * y - w * z)
    R[:, 0, 2] = 2 * (x * z + w * y)
    R[:, 1, 0] = 2 * (x * y + w * z)
    R[:, 1, 1] = 1 - 2 * (x * x + z * z)
    R[:, 1, 2] = 2 * (y * z - w * x)
    R[:, 2, 0] = 2 * (x * z - w * y)
    R[:, 2, 1] = 2 * (y * z + w * x)
    R[:, 2, 2] = 1 - 2 * (x * x + y * y)
    return R


def _compute_cov3d(scales: np.ndarray, rots: np.ndarray) -> np.ndarray:
    """Σ = R·diag(s)·diag(s)·Rᵀ  →  [N, 3, 3]"""
    R = _quat_to_rotmat(rots)          # [N, 3, 3]
    RS = R * scales[:, np.newaxis, :]  # [N, 3, 3] × broadcast [N, 1, 3]
    return np.einsum("nij,nkj->nik", RS, RS)


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
    Project all Gaussians to 2D and compute EWA covariance.

    Returns (means2d, cov2d, colors, opacities, depths, mask).
    """
    means = gaussians["means"]       # [N, 3]
    scales = gaussians["scales"]     # [N, 3]
    rots = gaussians["rots"]         # [N, 4]
    colors = gaussians["colors"]     # [N, 3]
    opacities = gaussians["opacities"]  # [N]

    N = len(means)
    ones = np.ones((N, 1), dtype=np.float32)
    means_h = np.concatenate([means, ones], axis=1)  # [N, 4]
    means_cam = (view_mat @ means_h.T).T             # [N, 4]

    x_cam = means_cam[:, 0]
    y_cam = means_cam[:, 1]
    z_cam = means_cam[:, 2]

    # Initial mask: in front of camera and non-trivial opacity
    mask = (z_cam > znear) & (opacities > 0.004)

    z_safe = np.maximum(z_cam, znear)

    # Perspective projection → pixel coordinates
    px = fx * x_cam / z_safe + cx
    py = fy * y_cam / z_safe + cy

    margin = 64
    mask &= (px > -margin) & (px < width + margin)
    mask &= (py > -margin) & (py < height + margin)

    means2d = np.stack([px, py], axis=1)  # [N, 2]

    # EWA Jacobian  J = [[fx/z, 0, -fx·x/z²], [0, fy/z, -fy·y/z²]]
    J = np.zeros((N, 2, 3), dtype=np.float32)
    J[:, 0, 0] = fx / z_safe
    J[:, 0, 2] = -fx * x_cam / (z_safe * z_safe)
    J[:, 1, 1] = fy / z_safe
    J[:, 1, 2] = -fy * y_cam / (z_safe * z_safe)

    W = view_mat[:3, :3].astype(np.float32)     # camera rotation
    T = np.einsum("nij,jk->nik", J, W.T)        # [N, 2, 3]

    cov3d = _compute_cov3d(scales, rots)         # [N, 3, 3]
    cov2d = np.einsum("nij,njk->nik", T, cov3d)  # [N, 2, 3]
    cov2d = np.einsum("nij,nkj->nik", cov2d, T)  # [N, 2, 2]

    # Low-pass filter (avoids aliasing)
    cov2d[:, 0, 0] += 0.3
    cov2d[:, 1, 1] += 0.3

    return means2d, cov2d, colors, opacities, z_cam, mask


# ---------------------------------------------------------------------------
# Rasterizer
# ---------------------------------------------------------------------------

def _rasterize(
    means2d: np.ndarray,    # [M, 2]
    cov2d: np.ndarray,      # [M, 2, 2]
    colors: np.ndarray,     # [M, 3]
    opacities: np.ndarray,  # [M]
    depths: np.ndarray,     # [M]
    width: int,
    height: int,
    max_gaussians: int,
) -> np.ndarray:
    """Back-to-front alpha compositing of 2D Gaussians. Returns RGB uint8 [H, W, 3]."""

    # Sort back-to-front then cap
    order = np.argsort(-depths)[:max_gaussians]

    m2d = means2d[order]
    c2d = cov2d[order]
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

        cx, cy = m2d[i]
        cov = c2d[i]
        color = col[i]
        alpha = float(opa[i])

        det = cov[0, 0] * cov[1, 1] - cov[0, 1] * cov[0, 1]
        if det < 1e-8:
            continue

        inv_det = 1.0 / det
        ic00 = cov[1, 1] * inv_det
        ic01 = -cov[0, 1] * inv_det
        ic11 = cov[0, 0] * inv_det

        # Bounding radius from largest eigenvalue
        trace = cov[0, 0] + cov[1, 1]
        discrim = max(0.0, (trace * 0.5) ** 2 - det)
        radius = min(int(math.ceil(3.0 * math.sqrt(trace * 0.5 + math.sqrt(discrim)))) + 1, 128)

        x0 = max(0, int(cx) - radius)
        x1 = min(width, int(cx) + radius + 1)
        y0 = max(0, int(cy) - radius)
        y1 = min(height, int(cy) + radius + 1)
        if x0 >= x1 or y0 >= y1:
            continue

        # Evaluate Gaussian on pixel patch
        xs = np.arange(x0, x1, dtype=np.float32) - cx
        ys = np.arange(y0, y1, dtype=np.float32) - cy
        xx, yy = np.meshgrid(xs, ys, indexing="xy")
        d = ic00 * xx * xx + 2.0 * ic01 * xx * yy + ic11 * yy * yy
        g = np.exp(-0.5 * d)  # [ph, pw]

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

    means2d, cov2d, colors, opacities, depths, mask = _project_gaussians(
        gaussians, view_mat, fx, fy, width / 2.0, height / 2.0, width, height,
    )

    n_valid = mask.sum()
    logger.info(f"[3DGS] {n_valid:,} / {len(mask):,} Gaussians visible")

    img_array = _rasterize(
        means2d[mask], cov2d[mask], colors[mask], opacities[mask], depths[mask],
        width, height, max_gaussians,
    )

    img = Image.fromarray(img_array, "RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    logger.info(f"[3DGS] Render complete: {len(buf.getvalue()):,} bytes")
    return buf.getvalue()
