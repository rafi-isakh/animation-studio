"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, anime_bg, bg_jobs, credits, health, i2v_storyboard_jobs, id_converter_jobs, image_jobs, jobs, panel_colorizer_jobs, panel_jobs, panel_splitter_jobs, panorama, prop_design_jobs, render_3d, story_splitter_jobs, storyboard_editor_jobs, storyboard_jobs, style_converter_jobs
from app.config import get_settings

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    logger.info("Starting Mithril Backend...")
    logger.info(f"Debug mode: {settings.debug}")

    # TODO: Initialize Firebase Admin SDK
    # TODO: Initialize Redis connection pool

    yield

    # Shutdown
    logger.info("Shutting down Mithril Backend...")
    # TODO: Close Redis connections


app = FastAPI(
    title="Mithril Backend",
    description="Async job orchestrator for video and image generation pipeline",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://toonyz.com",
        "https://*.toonyz.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(image_jobs.router, prefix="/api/v1")
app.include_router(bg_jobs.router, prefix="/api/v1")
app.include_router(prop_design_jobs.router, prefix="/api/v1")
app.include_router(panel_jobs.router, prefix="/api/v1")
app.include_router(panel_colorizer_jobs.router, prefix="/api/v1")
app.include_router(id_converter_jobs.router, prefix="/api/v1")
app.include_router(story_splitter_jobs.router, prefix="/api/v1")
app.include_router(panel_splitter_jobs.router, prefix="/api/v1")
app.include_router(storyboard_jobs.router, prefix="/api/v1")
app.include_router(i2v_storyboard_jobs.router, prefix="/api/v1")
app.include_router(storyboard_editor_jobs.router, prefix="/api/v1")
app.include_router(style_converter_jobs.router, prefix="/api/v1")
app.include_router(render_3d.router, prefix="/api/v1")
app.include_router(panorama.router, prefix="/api/v1")
app.include_router(anime_bg.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(credits.router, prefix="/api/v1")