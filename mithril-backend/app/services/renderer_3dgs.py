"""
3D Gaussian Splatting renderer (CPU).

Implements full EWA splatting: projects each Gaussian's 3D covariance to a
2D oriented ellipse via the Jacobian of perspective projection, then
alpha-composites them front-to-back.

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
# Camera helpers
# ---------------------------------------------------------------------------

def _look_at_pose(
    eye: np.ndarray,
    target: np.ndarray,
    up: np.ndarray,
    tilt_deg: float = 0.0,
) -> np.ndarray:
    """
    Camera-to-world 4×4 matrix in COLMAP/OpenCV convention:
      +X  right,  +Y  down (image Y),  +Z  forward into scene.
    """
    forward = target - eye
    norm = np.linalg.norm(forward)
    forward = forward / norm if norm > 1e-8 else np.array([0.0, 0.0, 1.0])

    right = np.cross(up, forward)
    if np.linalg.norm(right) < 1e-6:
        # Degenerate — forward aligned with up; pick arbitrary perpendicular
        alt_up = np.array([1.0, 0.0, 0.0]) if abs(up[0]) < 0.9 else np.array([0.0, 0.0, 1.0])
        right = np.cross(alt_up, forward)
    right /= np.linalg.norm(right)

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
    pose[:3, 1] = down
    pose[:3, 2] = forward
    pose[:3, 3] = eye
    return pose


def _detect_up_axis(extents: np.ndarray) -> np.ndarray:
    """
    Heuristic: for interior/room scenes the vertical axis typically has
    the smallest bounding-box extent (floor-to-ceiling is shorter than
    wall-to-wall).  Return the corresponding unit vector.

    Falls back to Y-up [0,1,0] if extents are roughly equal.
    """
    ratios = extents / np.max(extents)
    min_idx = int(np.argmin(extents))
    # Only use the heuristic when one axis is clearly shorter
    if ratios[min_idx] < 0.65:
        up = np.zeros(3, dtype=np.float64)
        up[min_idx] = 1.0
        axis_name = "XYZ"[min_idx]
        logger.info(f"[3DGS] Auto-detected {axis_name}-up (ratio={ratios[min_idx]:.2f})")
        return up
    logger.info("[3DGS] Extents roughly equal — defaulting to Y-up")
    return np.array([0.0, 1.0, 0.0])


# ---------------------------------------------------------------------------
# PLY loader
# ---------------------------------------------------------------------------

def _load_3dgs_ply(data: bytes) -> dict:
    """
    Load a 3DGS .ply file and return a dict of numpy arrays.
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

    means = np.stack([_col("x"), _col("y"), _col("z")], axis=1)

    if {"scale_0", "scale_1", "scale_2"} <= names:
        scales = np.exp(np.stack([_col("scale_0"), _col("scale_1"), _col("scale_2")], axis=1))
    else:
        scales = np.full((len(means), 3), 0.01, dtype=np.float32)

    if {"rot_0", "rot_1", "rot_2", "rot_3"} <= names:
        rots = np.stack([_col("rot_0"), _col("rot_1"), _col("rot_2"), _col("rot_3")], axis=1)
        norms = np.linalg.norm(rots, axis=1, keepdims=True)
        rots /= np.maximum(norms, 1e-8)
    else:
        rots = np.zeros((len(means), 4), dtype=np.float32)
        rots[:, 0] = 1.0

    if "opacity" in names:
        opacities = 1.0 / (1.0 + np.exp(-_col("opacity")))
    else:
        opacities = np.full(len(means), 0.5, dtype=np.float32)

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
_SPZ_MAGIC = b"NGSP"


def _convert_to_ply(data: bytes, src_fmt: str) -> bytes:
    """Use gaussforge to convert SPZ / SPLAT / KSPLAT / SOG → PLY bytes."""
    import gaussforge
    gf = gaussforge.GaussForge()

    result = gf.convert(data, src_fmt, "ply")
    if "error" in result:
        raise ValueError(f"gaussforge convert() failed: {result['error']}")

    ply_bytes = result.get("data", b"")
    logger.info(
        f"[3DGS] gaussforge convert result keys={list(result.keys())} "
        f"data_len={len(ply_bytes)} first_bytes={ply_bytes[:8].hex() if ply_bytes else 'n/a'}"
    )

    if not ply_bytes or not ply_bytes[:3] == b"ply":
        logger.info("[3DGS] convert() didn't return PLY, trying read()+write()")
        ir = gf.read(data, src_fmt)
        write_result = gf.write(ir, "ply")
        if isinstance(write_result, dict):
            ply_bytes = write_result.get("data", b"")
        else:
            ply_bytes = write_result

    if not ply_bytes or not ply_bytes[:3] == b"ply":
        raise ValueError(
            f"gaussforge did not produce valid PLY output. "
            f"First bytes: {ply_bytes[:8].hex() if ply_bytes else 'empty'}"
        )

    logger.info(f"[3DGS] gaussforge converted {src_fmt} → PLY ({len(ply_bytes):,} bytes)")
    return ply_bytes


def _load_gaussians(data: bytes) -> dict:
    """Auto-detect format from magic bytes and load."""
    if data[:3] == b"ply":
        return _load_3dgs_ply(data)

    if data[:4] == _SPZ_MAGIC or data[:2] == _GZIP_MAGIC:
        logger.info(f"[3DGS] Detected SPZ (first bytes: {data[:4].hex()}) — converting via gaussforge")
        ply_bytes = _convert_to_ply(data, "spz")
        return _load_3dgs_ply(ply_bytes)

    raise ValueError(
        f"Unknown 3DGS format. Expected PLY or SPZ. "
        f"Got first bytes: {data[:8].hex()}"
    )


# ---------------------------------------------------------------------------
# EWA projection — full covariance pipeline
# ---------------------------------------------------------------------------

def _quat_to_rotmat(quats: np.ndarray) -> np.ndarray:
    """Batch quaternion (w,x,y,z) [N,4] → rotation matrices [N,3,3]."""
    w, x, y, z = quats[:, 0], quats[:, 1], quats[:, 2], quats[:, 3]
    R = np.empty((len(quats), 3, 3), dtype=np.float32)
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


def _project_gaussians_ewa(
    gaussians: dict,
    view_mat: np.ndarray,
    fx: float,
    fy: float,
    cx: float,
    cy: float,
    width: int,
    height: int,
    znear: float = 0.1,
) -> tuple:
    """
    Full EWA projection: 3D covariance → Jacobian of projection → 2D covariance.

    Returns (means2d, cov2d_inv, radii, colors, opacities, depths, mask).
      cov2d_inv: [N, 2, 2]  inverse of 2D covariance (for Mahalanobis distance)
      radii:     [N]         screen-space extent in pixels (3σ of major axis)
    """
    means = gaussians["means"]
    scales = gaussians["scales"]
    rots = gaussians["rots"]
    colors = gaussians["colors"]
    opacities = gaussians["opacities"]

    N = len(means)

    # --- Transform Gaussian centres to camera space ---
    ones = np.ones((N, 1), dtype=np.float32)
    means_h = np.concatenate([means, ones], axis=1)
    means_cam = (view_mat @ means_h.T).T
    x_cam = means_cam[:, 0]
    y_cam = means_cam[:, 1]
    z_cam = means_cam[:, 2]

    # Visibility mask: in front of camera with non-trivial opacity
    mask = (z_cam > znear) & (opacities > 0.004)
    n_depth_ok = mask.sum()
    logger.info(f"[3DGS] Depth+opacity filter: {n_depth_ok:,}/{N:,} pass")

    # --- Build 3D covariance matrices (only for visible Gaussians) ---
    idx = np.where(mask)[0]
    M = len(idx)
    if M == 0:
        empty2 = np.zeros((N, 2), dtype=np.float32)
        empty22 = np.zeros((N, 2, 2), dtype=np.float32)
        empty1 = np.zeros(N, dtype=np.float32)
        return empty2, empty22, empty1, colors, opacities, z_cam, mask

    R_batch = _quat_to_rotmat(rots[idx])                    # [M, 3, 3]
    S_batch = scales[idx]                                     # [M, 3]
    # M_mat = R @ diag(S):  M_mat[:, :, j] = R[:, :, j] * S[:, j]
    M_mat = R_batch * S_batch[:, np.newaxis, :]               # [M, 3, 3]
    # Sigma_3d = M @ M^T
    Sigma_3d = np.einsum("nij,nkj->nik", M_mat, M_mat)       # [M, 3, 3]

    # --- Transform covariance to camera space ---
    W = view_mat[:3, :3].astype(np.float32)                   # [3, 3]
    # Sigma_cam = W @ Sigma_3d @ W^T
    WS = np.einsum("ij,njk->nik", W, Sigma_3d)               # [M, 3, 3]
    Sigma_cam = np.einsum("nij,kj->nik", WS, W)              # [M, 3, 3]

    # --- Jacobian of perspective projection ---
    xc = x_cam[idx]
    yc = y_cam[idx]
    zc = np.maximum(z_cam[idx], znear)
    zc2 = zc * zc

    J = np.zeros((M, 2, 3), dtype=np.float32)
    J[:, 0, 0] = fx / zc
    J[:, 0, 2] = -fx * xc / zc2
    J[:, 1, 1] = fy / zc
    J[:, 1, 2] = -fy * yc / zc2

    # Sigma_2d = J @ Sigma_cam @ J^T   [M, 2, 2]
    JS = np.einsum("nij,njk->nik", J, Sigma_cam)             # [M, 2, 3]
    Sigma_2d = np.einsum("nij,nkj->nik", JS, J)              # [M, 2, 2]

    # Anti-aliasing regularisation (from original 3DGS paper)
    Sigma_2d[:, 0, 0] += 0.3
    Sigma_2d[:, 1, 1] += 0.3

    # --- Invert 2×2 covariance ---
    a = Sigma_2d[:, 0, 0]
    b = Sigma_2d[:, 0, 1]
    c = Sigma_2d[:, 1, 0]
    d = Sigma_2d[:, 1, 1]
    det = a * d - b * c
    det = np.maximum(det, 1e-8)

    inv_det = 1.0 / det
    cov_inv = np.zeros((M, 2, 2), dtype=np.float32)
    cov_inv[:, 0, 0] = d * inv_det
    cov_inv[:, 0, 1] = -b * inv_det
    cov_inv[:, 1, 0] = -c * inv_det
    cov_inv[:, 1, 1] = a * inv_det

    # --- Screen-space radius from eigenvalues of Sigma_2d ---
    # eigenvalues of [[a,b],[c,d]]: 0.5*(a+d) ± sqrt(0.25*(a-d)² + b*c)
    trace = a + d
    disc = np.maximum(0.25 * (a - d) ** 2 + b * c, 0.0)
    lambda_max = 0.5 * trace + np.sqrt(disc)
    radii_sub = np.clip(3.0 * np.sqrt(lambda_max), 1.0, 1024.0)

    # --- Pixel coordinates ---
    px = fx * xc / zc + cx
    py = fy * yc / zc + cy

    # Viewport culling (generous margin for interior views)
    margin = max(width, height) * 2
    vis = (px > -margin) & (px < width + margin) & (py > -margin) & (py < height + margin)

    # Scatter results back into full-size arrays
    means2d_full = np.zeros((N, 2), dtype=np.float32)
    cov_inv_full = np.zeros((N, 2, 2), dtype=np.float32)
    radii_full = np.zeros(N, dtype=np.float32)

    means2d_full[idx, 0] = px
    means2d_full[idx, 1] = py
    cov_inv_full[idx] = cov_inv
    radii_full[idx] = radii_sub

    # Update mask with viewport filter
    mask_copy = mask.copy()
    mask_copy[idx[~vis]] = False

    n_final = mask_copy.sum()
    logger.info(f"[3DGS] After viewport cull: {n_final:,}/{N:,} visible")

    return means2d_full, cov_inv_full, radii_full, colors, opacities, z_cam, mask_copy


# ---------------------------------------------------------------------------
# Rasterizer — oriented ellipses, front-to-back
# ---------------------------------------------------------------------------

def _rasterize_ewa(
    means2d: np.ndarray,       # [M, 2]
    cov2d_inv: np.ndarray,     # [M, 2, 2]
    radii: np.ndarray,         # [M]
    colors: np.ndarray,        # [M, 3]
    opacities: np.ndarray,     # [M]
    depths: np.ndarray,        # [M]
    width: int,
    height: int,
    max_gaussians: int,
) -> np.ndarray:
    """Front-to-back alpha compositing of oriented 2D Gaussians.
    Returns RGB uint8 [H, W, 3]."""

    # Sort FRONT-to-back (closest first), then cap
    order = np.argsort(depths)[:max_gaussians]

    m2d = means2d[order]
    cinv = cov2d_inv[order]
    rad = radii[order]
    col = colors[order].astype(np.float32)
    opa = opacities[order].astype(np.float32)

    img = np.zeros((height, width, 3), dtype=np.float32)
    T = np.ones((height, width), dtype=np.float32)  # transmittance

    n_rendered = len(order)
    logger.info(f"[3DGS] Rasterizing {n_rendered:,} Gaussians (front-to-back)…")

    # Try Numba-accelerated path first, fall back to NumPy
    try:
        _rasterize_numba(m2d, cinv, rad, col, opa, img, T, width, height)
    except Exception:
        _rasterize_numpy(m2d, cinv, rad, col, opa, img, T, width, height)

    # Composite over white background
    img += T[:, :, np.newaxis]  # T * bg_color (white = 1.0)
    return (np.clip(img, 0.0, 1.0) * 255).astype(np.uint8)


def _rasterize_numpy(m2d, cinv, rad, col, opa, img, T, width, height):
    """Pure NumPy rasterization (fallback)."""
    n_rendered = len(m2d)
    for i in range(n_rendered):
        if T.max() < 0.005:
            break
        gx, gy = float(m2d[i, 0]), float(m2d[i, 1])
        radius_px = int(math.ceil(rad[i])) + 1
        alpha = float(opa[i])
        color = col[i]
        inv_cov = cinv[i]

        x0 = max(0, int(gx) - radius_px)
        x1 = min(width, int(gx) + radius_px + 1)
        y0 = max(0, int(gy) - radius_px)
        y1 = min(height, int(gy) + radius_px + 1)
        if x0 >= x1 or y0 >= y1:
            continue

        xs = np.arange(x0, x1, dtype=np.float32) - gx
        ys = np.arange(y0, y1, dtype=np.float32) - gy
        dx, dy = np.meshgrid(xs, ys, indexing="xy")

        power = -0.5 * (
            inv_cov[0, 0] * dx * dx
            + (inv_cov[0, 1] + inv_cov[1, 0]) * dx * dy
            + inv_cov[1, 1] * dy * dy
        )
        gauss = np.exp(np.clip(power, -16.0, 0.0))
        alpha_g = np.minimum(alpha * gauss, 0.99)

        contrib = T[y0:y1, x0:x1] * alpha_g
        img[y0:y1, x0:x1] += contrib[:, :, np.newaxis] * color
        T[y0:y1, x0:x1] *= (1.0 - alpha_g)


_NUMBA_KERNEL = None


def _get_numba_kernel():
    """Lazily compile and cache the Numba JIT kernel (compiled once per process)."""
    global _NUMBA_KERNEL
    if _NUMBA_KERNEL is not None:
        return _NUMBA_KERNEL
    from numba import njit
    import math as _m

    @njit(cache=True, parallel=False)
    def _kernel(m2d, cinv, rad, col, opa, img, T, width, height):
        n = len(m2d)
        for i in range(n):
            gx = m2d[i, 0]
            gy = m2d[i, 1]
            radius_px = int(_m.ceil(rad[i])) + 1
            alpha = opa[i]

            x0 = max(0, int(gx) - radius_px)
            x1 = min(width, int(gx) + radius_px + 1)
            y0 = max(0, int(gy) - radius_px)
            y1 = min(height, int(gy) + radius_px + 1)
            if x0 >= x1 or y0 >= y1:
                continue

            ic00 = cinv[i, 0, 0]
            ic01 = cinv[i, 0, 1] + cinv[i, 1, 0]
            ic11 = cinv[i, 1, 1]
            cr, cg, cb = col[i, 0], col[i, 1], col[i, 2]

            for py in range(y0, y1):
                dy = float(py) - gy
                for px in range(x0, x1):
                    dx = float(px) - gx
                    power = -0.5 * (ic00 * dx * dx + ic01 * dx * dy + ic11 * dy * dy)
                    if power < -16.0:
                        continue
                    g = _m.exp(power)
                    ag = alpha * g
                    if ag > 0.99:
                        ag = 0.99
                    t = T[py, px]
                    contrib = t * ag
                    img[py, px, 0] += contrib * cr
                    img[py, px, 1] += contrib * cg
                    img[py, px, 2] += contrib * cb
                    T[py, px] = t * (1.0 - ag)

    _NUMBA_KERNEL = _kernel
    return _NUMBA_KERNEL


def _rasterize_numba(m2d, cinv, rad, col, opa, img, T, width, height):
    """Numba JIT-accelerated rasterization (~10-30× faster than NumPy loop)."""
    _get_numba_kernel()(m2d, cinv, rad, col, opa, img, T, width, height)


# ---------------------------------------------------------------------------
# Public API
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
    up_axis: str = "auto",
    eye: tuple[float, float, float] | None = None,
    look_at_center: bool = False,
    fixed_extent: float | None = None,
) -> bytes:
    """
    Render a single camera view of a 3DGS model with full EWA splatting.

    Args:
        model_data: Raw bytes of the .ply / .spz file.
        azimuth: Horizontal look angle in degrees (0-360).
        elevation: Vertical look angle in degrees (-90 to 90).
        distance_multiplier: Orbit radius as multiple of scene extent (exterior only).
        fov: Vertical field of view in degrees.
        resolution: (width, height).
        camera_mode: "exterior" or "interior".
        tilt: Camera roll in degrees (Dutch angle).
        interior_offset_x/y/z: Camera offset from centre as fraction of half-extent.
        max_gaussians: Cap on rendered Gaussians. Lower = faster preview.
        up_axis: "auto", "y", or "z". Controls world up direction.
        fixed_extent: If set, override the dense-region extents with a uniform cube of
                      this size. Makes camera placement consistent across models of
                      different real-world scales.

    Returns:
        PNG image bytes.
    """
    if len(model_data) > MAX_MODEL_SIZE_BYTES:
        raise ValueError(f"Model too large ({len(model_data):,} bytes). Max: {MAX_MODEL_SIZE_BYTES:,}")

    gaussians = _load_gaussians(model_data)

    means = gaussians["means"]
    bbox_min = means.min(axis=0)
    bbox_max = means.max(axis=0)

    # Compute dense region using percentiles — ignores floater Gaussians that
    # inflate the raw bounding box far beyond the actual scene geometry.
    dense_min = np.percentile(means, 10, axis=0).astype(np.float64)
    dense_max = np.percentile(means, 90, axis=0).astype(np.float64)
    dense_center = ((dense_min + dense_max) / 2.0).astype(np.float64)
    dense_extents = (dense_max - dense_min).astype(np.float64)

    # Use dense region for all camera calculations (orbit center, interior offsets,
    # up-axis detection, look direction scale). Raw bbox kept only for diagnostics.
    center = dense_center
    if fixed_extent is not None and fixed_extent > 0:
        # Override per-model extents with a uniform cube so that camera placement
        # (offsets, orbit radius) is consistent across models of different scales.
        extents = np.array([fixed_extent, fixed_extent, fixed_extent], dtype=np.float64)
        logger.info(f"[3DGS] fixed_extent={fixed_extent} overrides dense extents {dense_extents}")
    else:
        extents = dense_extents
    max_extent = float(np.max(extents))

    logger.info(
        f"[3DGS] Raw bbox: min={bbox_min}, max={bbox_max}\n"
        f"[3DGS] Dense region (p10-p90): center={dense_center}, extents={dense_extents}"
    )

    # Determine world up vector
    if up_axis == "y":
        world_up = np.array([0.0, 1.0, 0.0])
    elif up_axis == "-y":
        world_up = np.array([0.0, -1.0, 0.0])
    elif up_axis == "z":
        world_up = np.array([0.0, 0.0, 1.0])
    elif up_axis == "-z":
        world_up = np.array([0.0, 0.0, -1.0])
    else:
        world_up = _detect_up_axis(extents)

    # Determine which axes form the horizontal plane
    up_idx = int(np.argmax(np.abs(world_up)))
    up_sign = float(np.sign(world_up[up_idx]))  # +1 for y/z, -1 for -y/-z
    horiz = [i for i in range(3) if i != up_idx]
    h0, h1 = horiz[0], horiz[1]

    # Build camera pose
    az = math.radians(azimuth)
    el = math.radians(elevation)

    if camera_mode == "environment":
        # For outdoor scenes, the dense region is misleading — the camera was
        # typically at ground level when the scene was captured.  We estimate
        # the ground plane from the Gaussian distribution:
        #   - Horizontal position: median of the two horizontal axes
        #   - Vertical position: 25th percentile of the up axis + a small
        #     head-height offset (5% of vertical extent), approximating
        #     where a person would stand.
        # The camera then looks outward using azimuth/elevation like interior mode.
        up_means = means[:, up_idx]
        ground_level = float(np.percentile(up_means, 25))
        vertical_extent = float(np.percentile(up_means, 90) - np.percentile(up_means, 10))
        head_offset = vertical_extent * 0.05  # slightly above ground

        env_eye = np.zeros(3, dtype=np.float64)
        env_eye[h0] = float(np.median(means[:, h0]))
        env_eye[h1] = float(np.median(means[:, h1]))
        env_eye[up_idx] = ground_level + up_sign * head_offset

        # Apply interior offsets for fine-tuning position
        env_half = extents / 2.0
        env_eye[h0] += interior_offset_x * env_half[h0]
        env_eye[up_idx] += up_sign * interior_offset_y * env_half[up_idx]
        env_eye[h1] += interior_offset_z * env_half[h1]

        eye = env_eye
        cos_el = math.cos(el)
        look_dir = np.zeros(3)
        look_dir[h0] = cos_el * math.cos(az)
        look_dir[h1] = cos_el * math.sin(az)
        look_dir[up_idx] = up_sign * math.sin(el)
        target = eye + look_dir * max_extent

    elif camera_mode == "absolute" and eye is not None:
        eye_pos = np.array(eye, dtype=np.float64)
        if look_at_center:
            # Always look toward the dense center (where most Gaussians are)
            target = dense_center.copy()
        else:
            # Use azimuth/elevation as look direction from the eye position
            cos_el = math.cos(el)
            look_dir = np.zeros(3)
            look_dir[h0] = cos_el * math.cos(az)
            look_dir[h1] = cos_el * math.sin(az)
            look_dir[up_idx] = up_sign * math.sin(el)
            target = eye_pos + look_dir * max_extent
        eye = eye_pos
    elif camera_mode == "interior":
        half = extents / 2.0
        # Map offsets to semantic axes: X→horizontal1, Y→vertical, Z→horizontal2
        # interior_offset_y is always "upward" regardless of up_axis sign
        offset = np.zeros(3)
        offset[h0] = interior_offset_x * half[h0]
        offset[up_idx] = up_sign * interior_offset_y * half[up_idx]
        offset[h1] = interior_offset_z * half[h1]
        eye = center + offset
        # Look direction in the coordinate system defined by up_axis
        cos_el = math.cos(el)
        look_dir = np.zeros(3)
        look_dir[h0] = cos_el * math.cos(az)
        look_dir[h1] = cos_el * math.sin(az)
        look_dir[up_idx] = up_sign * math.sin(el)
        target = eye + look_dir * max_extent
    else:
        radius = max_extent * distance_multiplier
        offset = np.zeros(3)
        cos_el = math.cos(el)
        offset[h0] = cos_el * math.cos(az)
        offset[h1] = cos_el * math.sin(az)
        offset[up_idx] = up_sign * math.sin(el)
        eye = center + radius * offset
        target = center

    logger.info(
        f"[3DGS] Camera mode={camera_mode} up={world_up} "
        f"eye={eye} target={target} az={azimuth} el={elevation}"
    )

    pose = _look_at_pose(eye, target, world_up, tilt)
    view_mat = np.linalg.inv(pose).astype(np.float32)

    width, height = resolution
    fov_rad = math.radians(fov)
    fy = height / (2.0 * math.tan(fov_rad / 2.0))
    fx = fy  # square pixels

    # Use smaller znear for interior/absolute/environment modes to see close Gaussians
    znear = 0.01 if camera_mode in ("interior", "absolute", "environment") else 0.1

    means2d, cov2d_inv, radii, colors, opacities, depths, mask = _project_gaussians_ewa(
        gaussians, view_mat, fx, fy, width / 2.0, height / 2.0, width, height, znear=znear,
    )

    n_valid = mask.sum()
    logger.info(f"[3DGS] {n_valid:,} / {len(mask):,} Gaussians visible")

    img_array = _rasterize_ewa(
        means2d[mask], cov2d_inv[mask], radii[mask],
        colors[mask], opacities[mask], depths[mask],
        width, height, max_gaussians,
    )

    img = Image.fromarray(img_array, "RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()
    logger.info(f"[3DGS] Render complete: {len(png_bytes):,} bytes")

    scene_info = {
        # center/extents now refer to the dense region (used for camera)
        "center": dense_center.tolist(),
        "extents": dense_extents.tolist(),
        "dense_min": dense_min.tolist(),
        "dense_max": dense_max.tolist(),
        # raw bbox kept for reference
        "bbox_min": bbox_min.tolist(),
        "bbox_max": bbox_max.tolist(),
        "eye": eye.tolist() if isinstance(eye, np.ndarray) else list(eye),
        "target": target.tolist(),
    }
    return png_bytes, scene_info
