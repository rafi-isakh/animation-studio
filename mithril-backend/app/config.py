"""Application configuration using Pydantic Settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Firebase
    firebase_project_id: str = ""
    firebase_service_account_json: str = ""

    # AWS S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "ap-northeast-2"
    videos_bucket: str = ""
    cloudfront_domain: str = ""

    # Provider API Keys (fallback)
    sora_api_key: str = ""
    gemini_api_key: str = ""
    grok_api_key: str = ""  # xAI Grok fallback key

    # Application
    debug: bool = False
    log_level: str = "INFO"
    max_concurrent_jobs_per_project: int = 10

    # Internal service auth (for Next.js proxy calls)
    internal_service_secret: str = ""

    @property
    def cloudfront_url(self) -> str:
        """Get the CloudFront base URL."""
        if self.cloudfront_domain:
            return f"https://{self.cloudfront_domain}"
        return ""


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()