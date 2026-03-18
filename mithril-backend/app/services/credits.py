"""Credits tracking service for recording AI provider API usage costs."""

import logging
import uuid
from datetime import datetime, timezone

from google.cloud import firestore

from app.services.firestore import get_db

logger = logging.getLogger(__name__)

# Flat per-image costs: (job_type, provider_id) -> USD per image
IMAGE_COST_TABLE: dict[tuple[str, str], float] = {
    # Gemini image-output models
    ("image", "gemini"): 0.039,
    ("background", "gemini"): 0.039,
    ("prop_design_sheet", "gemini"): 0.039,
    ("panel", "gemini"): 0.134,
    ("panel_colorizer", "gemini"): 0.134,
    ("storyboard_editor", "gemini"): 0.039,
    # xAI Grok image
    ("panel", "grok"): 0.02,
    ("panel_colorizer", "grok"): 0.02,
    # ModelsLab z_image_turbo
    ("panel", "z_image_turbo"): 0.0047,
    ("panel_colorizer", "z_image_turbo"): 0.0047,
    # PixAI style converter
    ("style_converter", "pixai"): 0.09,
}

# Token-based pricing for Gemini text/multimodal models: model -> (input $/1M, output $/1M)
TOKEN_PRICING: dict[str, tuple[float, float]] = {
    "gemini-2.5-pro": (1.25, 10.00),
    "gemini-2.5-flash": (0.30, 2.50),
    "gemini-3-pro-preview": (2.00, 12.00),
}

# Video pricing: provider_id -> USD per second of generated video
VIDEO_COST_PER_SECOND: dict[str, float] = {
    "sora": 0.10,
    "veo3": 0.15,
    "grok_i2v": 0.05,
    "grok_imagine_i2v": 0.05,
    "wan_i2v": 0.15,
    "wan22_i2v": 0.15,
}

DEFAULT_COST_USD = 0.01


def get_credit_cost(job_type: str, provider_id: str) -> float:
    """Look up flat per-image cost for a given job type and provider."""
    return IMAGE_COST_TABLE.get((job_type, provider_id), DEFAULT_COST_USD)


def get_text_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost for a Gemini generate_content call based on token usage."""
    pricing = TOKEN_PRICING.get(model)
    if not pricing:
        return DEFAULT_COST_USD
    input_price, output_price = pricing
    return (input_tokens * input_price + output_tokens * output_price) / 1_000_000


def get_video_cost(provider_id: str, duration_seconds: int) -> float:
    """Calculate cost for a video generation job based on duration."""
    rate = VIDEO_COST_PER_SECOND.get(provider_id, DEFAULT_COST_USD)
    return rate * duration_seconds


class CreditsService:
    """Service for recording and querying AI API credit usage in Firestore."""

    TRANSACTIONS_COLLECTION = "credit_transactions"
    USER_CREDITS_COLLECTION = "user_credits"

    def __init__(self) -> None:
        self.db = get_db()

    async def record_credit(
        self,
        user_id: str,
        project_id: str,
        job_id: str,
        job_type: str,
        provider_id: str,
        cost_usd: float,
    ) -> None:
        """
        Record a credit transaction for a successful provider API call.

        Writes a transaction document, atomically increments user total, and
        updates the job document with the incurred cost.
        """
        now = datetime.now(timezone.utc).isoformat()
        transaction_id = str(uuid.uuid4())

        transaction_data = {
            "id": transaction_id,
            "user_id": user_id,
            "project_id": project_id,
            "job_id": job_id,
            "job_type": job_type,
            "provider_id": provider_id,
            "cost_usd": cost_usd,
            "created_at": now,
        }

        # Use a Firestore batch for the transaction + user summary writes
        batch = self.db.batch()

        # 1. Write the transaction document
        tx_ref = self.db.collection(self.TRANSACTIONS_COLLECTION).document(transaction_id)
        batch.set(tx_ref, transaction_data)

        # 2. Upsert user summary with atomic increment
        user_ref = self.db.collection(self.USER_CREDITS_COLLECTION).document(user_id)
        batch.set(
            user_ref,
            {
                "user_id": user_id,
                "total_used_usd": firestore.Increment(cost_usd),
                "transaction_count": firestore.Increment(1),
                "last_updated": now,
            },
            merge=True,
        )

        await batch.commit()

        # 3. Update job document with cost (outside batch — job_queue is separate)
        job_ref = self.db.collection("job_queue").document(job_id)
        await job_ref.update({"cost_usd": firestore.Increment(cost_usd)})

        logger.debug(
            f"Recorded credit: user={user_id} job={job_id} "
            f"type={job_type} provider={provider_id} cost=${cost_usd:.4f}"
        )

    async def get_user_summary(
        self,
        user_id: str,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> dict:
        """Return total usage summary for a user.

        When date filters are provided, aggregates from transactions instead of
        the pre-computed summary document.
        """
        if start_date or end_date:
            query = self.db.collection(self.TRANSACTIONS_COLLECTION).where("user_id", "==", user_id)
            if start_date:
                query = query.where("created_at", ">=", start_date)
            if end_date:
                query = query.where("created_at", "<=", end_date)
            docs = await query.get()
            total_usd = sum((d.to_dict() or {}).get("cost_usd", 0.0) for d in docs)
            return {
                "user_id": user_id,
                "total_used_usd": round(total_usd, 6),
                "transaction_count": len(docs),
            }

        doc = await self.db.collection(self.USER_CREDITS_COLLECTION).document(user_id).get()
        if not doc.exists:
            return {"user_id": user_id, "total_used_usd": 0.0, "transaction_count": 0}
        return doc.to_dict() or {}

    async def get_project_usage(
        self,
        user_id: str,
        project_id: str,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict]:
        """Return all credit transactions for a specific project."""
        query = (
            self.db.collection(self.TRANSACTIONS_COLLECTION)
            .where("user_id", "==", user_id)
            .where("project_id", "==", project_id)
        )
        if start_date:
            query = query.where("created_at", ">=", start_date)
        if end_date:
            query = query.where("created_at", "<=", end_date)
        query = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(500)
        docs = await query.get()
        return [doc.to_dict() for doc in docs]

    async def get_stage_breakdown(
        self,
        user_id: str | None = None,
        project_id: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict]:
        """Aggregate credit transactions grouped by job_type (stage), sorted by cost desc."""
        query = self.db.collection(self.TRANSACTIONS_COLLECTION)

        if user_id:
            query = query.where("user_id", "==", user_id)
        if project_id:
            query = query.where("project_id", "==", project_id)
        if start_date:
            query = query.where("created_at", ">=", start_date)
        if end_date:
            query = query.where("created_at", "<=", end_date)

        docs = await query.get()

        aggregated: dict[str, dict] = {}
        for doc in docs:
            data = doc.to_dict() or {}
            stage = data.get("job_type", "unknown")
            if stage not in aggregated:
                aggregated[stage] = {"job_type": stage, "total_usd": 0.0, "call_count": 0}
            aggregated[stage]["total_usd"] += data.get("cost_usd", 0.0)
            aggregated[stage]["call_count"] += 1

        stages = [
            {**v, "total_usd": round(v["total_usd"], 6)}
            for v in sorted(aggregated.values(), key=lambda x: x["total_usd"], reverse=True)
        ]
        return stages

    async def get_provider_breakdown(
        self,
        user_id: str | None = None,
        project_id: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
    ) -> list[dict]:
        """Aggregate credit transactions grouped by provider_id, sorted by cost desc."""
        query = self.db.collection(self.TRANSACTIONS_COLLECTION)

        if user_id:
            query = query.where("user_id", "==", user_id)
        if project_id:
            query = query.where("project_id", "==", project_id)
        if start_date:
            query = query.where("created_at", ">=", start_date)
        if end_date:
            query = query.where("created_at", "<=", end_date)

        docs = await query.get()

        aggregated: dict[str, dict] = {}
        for doc in docs:
            data = doc.to_dict() or {}
            provider = data.get("provider_id", "unknown")
            if provider not in aggregated:
                aggregated[provider] = {"provider_id": provider, "total_usd": 0.0, "call_count": 0}
            aggregated[provider]["total_usd"] += data.get("cost_usd", 0.0)
            aggregated[provider]["call_count"] += 1

        return [
            {**v, "total_usd": round(v["total_usd"], 6)}
            for v in sorted(aggregated.values(), key=lambda x: x["total_usd"], reverse=True)
        ]

    async def get_usage_breakdown(
        self,
        user_id: str | None = None,
        provider_id: str | None = None,
        job_type: str | None = None,
        start_date: str | None = None,
        end_date: str | None = None,
        limit: int = 100,
    ) -> list[dict]:
        """Admin query: filterable usage breakdown."""
        query = self.db.collection(self.TRANSACTIONS_COLLECTION)

        if user_id:
            query = query.where("user_id", "==", user_id)
        if provider_id:
            query = query.where("provider_id", "==", provider_id)
        if job_type:
            query = query.where("job_type", "==", job_type)
        if start_date:
            query = query.where("created_at", ">=", start_date)
        if end_date:
            query = query.where("created_at", "<=", end_date)

        query = query.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
        docs = await query.get()
        return [doc.to_dict() for doc in docs]


_credits_service: CreditsService | None = None


def get_credits_service() -> CreditsService:
    """Get or create CreditsService singleton."""
    global _credits_service
    if _credits_service is None:
        _credits_service = CreditsService()
    return _credits_service
