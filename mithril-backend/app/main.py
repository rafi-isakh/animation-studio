"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, bg_jobs, health, image_jobs, jobs, prop_design_jobs
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
app.include_router(admin.router, prefix="/api/v1")