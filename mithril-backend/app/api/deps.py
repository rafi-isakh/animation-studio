"""FastAPI dependencies for authentication and services."""

import base64
import json
import logging
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth, credentials, initialize_app, get_app
from firebase_admin.exceptions import FirebaseError
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# HTTP Bearer token security scheme (optional for internal calls)
security = HTTPBearer(auto_error=False)

# Firebase app initialization flag
_firebase_initialized = False


def _parse_service_account(value: str) -> dict:
    """
    Parse service account JSON from env var.

    Supports:
    - Raw JSON string: {"type":"service_account",...}
    - Base64 encoded JSON: eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Iiw...
    """
    value = value.strip()

    # Try raw JSON first (starts with '{')
    if value.startswith("{"):
        return json.loads(value)

    # Try base64 decode
    try:
        decoded = base64.b64decode(value).decode("utf-8")
        return json.loads(decoded)
    except Exception:
        pass

    raise ValueError("Invalid service account format. Use JSON or base64-encoded JSON.")


def init_firebase() -> None:
    """Initialize Firebase Admin SDK if not already initialized."""
    global _firebase_initialized

    if _firebase_initialized:
        return

    try:
        get_app()
        _firebase_initialized = True
        return
    except ValueError:
        pass

    if not settings.firebase_service_account_json:
        logger.warning("Firebase service account JSON not configured")
        return

    try:
        service_account = _parse_service_account(settings.firebase_service_account_json)
        cred = credentials.Certificate(service_account)
        initialize_app(cred, {"projectId": settings.firebase_project_id})
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise


class CurrentUser(BaseModel):
    """Authenticated user information extracted from Firebase token."""

    uid: str
    email: str | None = None
    name: str | None = None
    picture: str | None = None


async def get_current_user(
    token: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    x_internal_secret: Annotated[str | None, Header()] = None,
    x_user_id: Annotated[str | None, Header()] = None,
    x_user_email: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    """
    Validate user identity via Firebase ID token OR internal service auth.

    Supports two authentication modes:
    1. Firebase ID token (Bearer token) - for direct client calls
    2. Internal service auth (X-Internal-Secret header) - for Next.js proxy calls

    Args:
        token: Optional Bearer token from Authorization header
        x_internal_secret: Internal service secret for server-to-server calls
        x_user_id: User ID passed from internal service
        x_user_email: User email passed from internal service

    Returns:
        CurrentUser with validated user info

    Raises:
        HTTPException 401 if authentication fails
    """
    # Check for internal service auth first
    if x_internal_secret and x_user_id:
        if not settings.internal_service_secret:
            logger.warning("Internal service auth attempted but no secret configured")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Internal service auth not configured",
            )

        if x_internal_secret != settings.internal_service_secret:
            logger.warning("Invalid internal service secret")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid internal service credentials",
            )

        logger.debug(f"Internal service auth successful for user {x_user_id}")
        return CurrentUser(
            uid=x_user_id,
            email=x_user_email,
        )

    # Fall back to Firebase token auth
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    init_firebase()

    try:
        decoded_token = auth.verify_id_token(token.credentials)

        return CurrentUser(
            uid=decoded_token["uid"],
            email=decoded_token.get("email"),
            name=decoded_token.get("name"),
            picture=decoded_token.get("picture"),
        )
    except FirebaseError as e:
        logger.warning(f"Firebase token validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error validating token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Type alias for dependency injection
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]