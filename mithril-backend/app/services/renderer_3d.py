"""3D model rendering service using trimesh and pyrender."""

import io
import logging
import math
import os
import tempfile

import numpy as np
import trimesh
import trimesh.transformations as tf
from PIL import Image

logger = logging.getLogger(__name__)

# Headless rendering via OSMesa (runs inside Docker on Linux)
os.environ["PYOPENGL_PLATFORM"] = os.environ.get("PYOPENGL_PLATFORM", "osmesa")

import pyrender  # noqa: E402 — must import after setting PYOPENGL_PLATFORM


MAX_MODEL_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB


def _look_at_pose(eye: np.ndarray, target: np.ndarray, tilt_deg: float = 0.0) -> np.ndarray:
    """
    Build a 4x4 camera-to-world matrix.

    Camera convention: -Z forward, +Y up, +X right.
    tilt_deg rotates the camera around its forward (look) axis (Dutch angle).
    """
    forward = target - eye
    norm = np.linalg.norm(forward)
    if norm < 1e-8:
        forward = np.array([0.0, 0.0, -1.0])
    else:
        forward = forward / norm

    world_up = np.array([0.0, 1.0, 0.0])
    right = np.cross(forward, world_up)
    if np.linalg.norm(right) < 1e-6:
        world_up = np.array([0.0, 0.0, 1.0])
        right = np.cross(forward, world_up)
    right = right / np.linalg.norm(right)

    up = np.cross(right, forward)
    up = up / np.linalg.norm(up)

    # Apply tilt (roll around the forward axis)
    if abs(tilt_deg) > 0.01:
        tilt_rad = math.radians(tilt_deg)
        cos_t = math.cos(tilt_rad)
        sin_t = math.sin(tilt_rad)
        new_right = cos_t * right + sin_t * up
        new_up = -sin_t * right + cos_t * up
        right = new_right / np.linalg.norm(new_right)
        up = new_up / np.linalg.norm(new_up)

    pose = np.eye(4)
    pose[:3, 0] = right
    pose[:3, 1] = up
    pose[:3, 2] = -forward
    pose[:3, 3] = eye
    return pose


def _exterior_camera_pose(
    azimuth_deg: float,
    elevation_deg: float,
    radius: float,
    target: np.ndarray,
    tilt_deg: float = 0.0,
) -> np.ndarray:
    """Camera on a sphere looking inward at the target."""
    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)

    x = target[0] + radius * math.cos(el) * math.cos(az)
    y = target[1] + radius * math.sin(el)
    z = target[2] + radius * math.cos(el) * math.sin(az)
    eye = np.array([x, y, z])

    return _look_at_pose(eye, target, tilt_deg)


def _interior_camera_pose(
    azimuth_deg: float,
    elevation_deg: float,
    center: np.ndarray,
    max_extent: float,
    tilt_deg: float = 0.0,
) -> np.ndarray:
    """
    Camera at the center of the model, looking outward.

    azimuth/elevation control the look direction (not position).
    """
    eye = center.copy()

    az = math.radians(azimuth_deg)
    el = math.radians(elevation_deg)

    # Look direction — outward from center
    look_x = math.cos(el) * math.cos(az)
    look_y = math.sin(el)
    look_z = math.cos(el) * math.sin(az)
    look_target = eye + np.array([look_x, look_y, look_z]) * max_extent

    return _look_at_pose(eye, look_target, tilt_deg)


def _add_lighting(scene: pyrender.Scene, bbox_extents: np.ndarray, center: np.ndarray) -> None:
    """Add 3-point lighting + ambient to the scene."""
    max_ext = float(np.max(bbox_extents))
    intensity = max_ext * 5.0

    scene.ambient_light = np.array([0.3, 0.3, 0.3, 1.0])

    key_pose = tf.translation_matrix(center + np.array([max_ext, max_ext * 1.5, max_ext]))
    scene.add(pyrender.DirectionalLight(color=[1.0, 1.0, 0.95], intensity=intensity * 0.8), pose=key_pose)

    fill_pose = tf.translation_matrix(center + np.array([-max_ext, max_ext * 0.5, max_ext * 0.8]))
    scene.add(pyrender.DirectionalLight(color=[0.9, 0.9, 1.0], intensity=intensity * 0.4), pose=fill_pose)

    rim_pose = tf.translation_matrix(center + np.array([0, max_ext * 1.2, -max_ext]))
    scene.add(pyrender.DirectionalLight(color=[1.0, 1.0, 1.0], intensity=intensity * 0.3), pose=rim_pose)

    # Interior point light at center for inside views
    scene.add(pyrender.PointLight(color=[1.0, 1.0, 1.0], intensity=intensity * 0.5),
              pose=tf.translation_matrix(center))


def _load_scene_with_materials(tmp_path: str) -> pyrender.Scene:
    """
    Load a .glb file and convert to pyrender Scene, preserving materials and textures.
    """
    scene_or_mesh = trimesh.load(tmp_path, force="scene")

    if isinstance(scene_or_mesh, trimesh.Scene):
        tm_scene = scene_or_mesh
    else:
        tm_scene = trimesh.Scene(geometry={"model": scene_or_mesh})

    # Build pyrender scene manually to better handle materials
    pr_scene = pyrender.Scene(
        bg_color=np.array([0.1, 0.1, 0.1, 1.0]),
        ambient_light=np.array([0.3, 0.3, 0.3, 1.0]),
    )

    for node_name in tm_scene.graph.nodes_geometry:
        transform, geometry_name = tm_scene.graph[node_name]
        mesh = tm_scene.geometry[geometry_name]

        if not isinstance(mesh, trimesh.Trimesh):
            continue

        # Try to preserve the original material
        primitives = []
        if hasattr(mesh.visual, "material") and mesh.visual.kind == "texture":
            material = mesh.visual.material
            # Build pyrender PBR material from trimesh material
            base_color = None
            base_texture = None

            if hasattr(material, "baseColorTexture") and material.baseColorTexture is not None:
                # Has a texture image
                tex_image = material.baseColorTexture
                if hasattr(tex_image, "convert"):
                    tex_image = np.array(tex_image.convert("RGBA"))
                elif isinstance(tex_image, np.ndarray):
                    pass
                else:
                    tex_image = np.array(tex_image)
                base_texture = pyrender.Texture(source=tex_image, source_channels="RGBA")

            if hasattr(material, "baseColorFactor") and material.baseColorFactor is not None:
                base_color = np.array(material.baseColorFactor, dtype=np.float32)
                if len(base_color) == 3:
                    base_color = np.append(base_color, 1.0)
                base_color = base_color / 255.0 if base_color.max() > 1.0 else base_color

            pr_material = pyrender.MetallicRoughnessMaterial(
                baseColorFactor=base_color if base_color is not None else [0.8, 0.8, 0.8, 1.0],
                baseColorTexture=base_texture,
                metallicFactor=getattr(material, "metallicFactor", 0.0),
                roughnessFactor=getattr(material, "roughnessFactor", 0.8),
                doubleSided=True,  # Render both sides for interior views
            )
            pr_mesh_prim = pyrender.Primitive(
                positions=mesh.vertices,
                normals=mesh.vertex_normals,
                indices=mesh.faces,
                texcoord_0=mesh.visual.uv if hasattr(mesh.visual, "uv") and mesh.visual.uv is not None else None,
                material=pr_material,
            )
            primitives.append(pr_mesh_prim)

        elif hasattr(mesh.visual, "vertex_colors") and mesh.visual.kind == "vertex":
            # Vertex colors
            colors = mesh.visual.vertex_colors
            if colors is not None:
                colors_float = colors[:, :4].astype(np.float32) / 255.0
            else:
                colors_float = None

            pr_material = pyrender.MetallicRoughnessMaterial(
                baseColorFactor=[0.8, 0.8, 0.8, 1.0],
                metallicFactor=0.0,
                roughnessFactor=0.8,
                doubleSided=True,
            )
            pr_mesh_prim = pyrender.Primitive(
                positions=mesh.vertices,
                normals=mesh.vertex_normals,
                indices=mesh.faces,
                color_0=colors_float,
                material=pr_material,
            )
            primitives.append(pr_mesh_prim)

        else:
            # Fallback: use face/vertex colors or default gray
            face_colors = None
            if hasattr(mesh.visual, "face_colors"):
                face_colors = mesh.visual.face_colors

            pr_material = pyrender.MetallicRoughnessMaterial(
                baseColorFactor=[0.7, 0.7, 0.7, 1.0],
                metallicFactor=0.0,
                roughnessFactor=0.9,
                doubleSided=True,
            )
            pr_mesh_prim = pyrender.Primitive(
                positions=mesh.vertices,
                normals=mesh.vertex_normals,
                indices=mesh.faces,
                material=pr_material,
            )
            primitives.append(pr_mesh_prim)

        if primitives:
            pr_mesh = pyrender.Mesh(primitives=primitives)
            pr_scene.add(pr_mesh, pose=transform)

    return pr_scene, tm_scene


async def render_single_view(
    model_data: bytes,
    azimuth: float = 0.0,
    elevation: float = 30.0,
    distance_multiplier: float = 2.5,
    fov: float = 45.0,
    resolution: tuple[int, int] = (1920, 1080),
    camera_mode: str = "exterior",
    tilt: float = 0.0,
) -> bytes:
    """
    Render a single view of a .glb model.

    Args:
        model_data: Raw bytes of the .glb file.
        azimuth: Horizontal angle in degrees (0-360).
        elevation: Vertical angle in degrees (-90 to 90).
        distance_multiplier: Camera distance multiplier (exterior) or ignored (interior).
        fov: Field of view in degrees.
        resolution: (width, height) of the rendered image.
        camera_mode: "exterior" (orbit outside looking in) or "interior" (at center looking out).
        tilt: Camera roll in degrees (-180 to 180). Creates Dutch angle effect.

    Returns:
        PNG image bytes.
    """
    if len(model_data) > MAX_MODEL_SIZE_BYTES:
        raise ValueError(f"Model file too large ({len(model_data)} bytes). Max: {MAX_MODEL_SIZE_BYTES}")

    with tempfile.NamedTemporaryFile(suffix=".glb", delete=False) as tmp:
        tmp.write(model_data)
        tmp_path = tmp.name

    try:
        logger.info(f"Loading .glb model ({len(model_data)} bytes)...")

        # Try enhanced material loading first, fall back to simple
        try:
            pr_scene, tm_scene = _load_scene_with_materials(tmp_path)
        except Exception as e:
            logger.warning(f"Enhanced material loading failed ({e}), falling back to simple loader")
            scene_or_mesh = trimesh.load(tmp_path, force="scene")
            if not isinstance(scene_or_mesh, trimesh.Scene):
                scene_or_mesh = trimesh.Scene(geometry={"model": scene_or_mesh})
            tm_scene = scene_or_mesh
            pr_scene = pyrender.Scene.from_trimesh_scene(tm_scene)

        # Compute bounding box
        bbox = tm_scene.bounds
        center = (bbox[0] + bbox[1]) / 2.0
        extents = bbox[1] - bbox[0]
        max_extent = float(np.max(extents))

        logger.info(f"Model bounds: center={center}, extents={extents}, mode={camera_mode}")

        # Add lighting
        _add_lighting(pr_scene, extents, center)

        # Camera
        width, height = resolution
        camera = pyrender.PerspectiveCamera(
            yfov=math.radians(fov),
            aspectRatio=width / height,
            znear=max_extent * 0.001,  # Very small near plane for interior views
            zfar=max_extent * 50.0,
        )

        if camera_mode == "interior":
            pose = _interior_camera_pose(azimuth, elevation, center, max_extent, tilt)
            logger.info(f"Interior camera at center, looking az={azimuth} el={elevation} tilt={tilt}")
        else:
            orbit_radius = max_extent * distance_multiplier
            pose = _exterior_camera_pose(azimuth, elevation, orbit_radius, center, tilt)
            logger.info(f"Exterior camera at distance={orbit_radius:.2f} (x{distance_multiplier}) tilt={tilt}")

        pr_scene.add(camera, pose=pose)

        # Render
        renderer = pyrender.OffscreenRenderer(viewport_width=width, viewport_height=height)
        try:
            color, _ = renderer.render(pr_scene)
        finally:
            renderer.delete()

        # Convert to PNG
        img = Image.fromarray(color)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_bytes = buf.getvalue()

        logger.info(f"Rendered az={azimuth} el={elevation} mode={camera_mode}: {len(png_bytes)} bytes")
        return png_bytes

    finally:
        os.unlink(tmp_path)
