"""Google Cloud Monitoring service for Firestore billable metrics."""

import asyncio
import base64
import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from google.cloud import monitoring_v3
from google.oauth2 import service_account

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Simple in-memory TTL cache (60s — shorter than credits' 5 min)
# ---------------------------------------------------------------------------

_CACHE_TTL_SECONDS = 60


@dataclass
class _CacheEntry:
    data: Any
    expires_at: float


_query_cache: dict[str, _CacheEntry] = {}


def _cache_get(key: str) -> Any | None:
    entry = _query_cache.get(key)
    if entry and time.monotonic() < entry.expires_at:
        return entry.data
    _query_cache.pop(key, None)
    return None


def _cache_set(key: str, data: Any) -> None:
    _query_cache[key] = _CacheEntry(data=data, expires_at=time.monotonic() + _CACHE_TTL_SECONDS)


# ---------------------------------------------------------------------------
# Range → query config
# ---------------------------------------------------------------------------

RANGE_CONFIG: dict[str, dict[str, int]] = {
    "60m": {"minutes": 60, "alignment_seconds": 60},
    "6h": {"minutes": 360, "alignment_seconds": 300},
    "24h": {"minutes": 1440, "alignment_seconds": 900},
    "7d": {"minutes": 10080, "alignment_seconds": 3600},
}

METRIC_TYPES: dict[str, str] = {
    "reads": "firestore.googleapis.com/document/read_count",
    "writes": "firestore.googleapis.com/document/write_count",
    "deletes": "firestore.googleapis.com/document/delete_count",
}

_MONITORING_SCOPES = ["https://www.googleapis.com/auth/monitoring.read"]


def _parse_service_account(value: str) -> dict:
    value = value.strip()
    if value.startswith("{"):
        return json.loads(value)
    try:
        decoded = base64.b64decode(value).decode("utf-8")
        return json.loads(decoded)
    except Exception:
        pass
    raise ValueError("Invalid service account format")


class MonitoringService:
    def __init__(self) -> None:
        if settings.firebase_service_account_json:
            sa_info = _parse_service_account(settings.firebase_service_account_json)
            creds = service_account.Credentials.from_service_account_info(
                sa_info, scopes=_MONITORING_SCOPES
            )
            self._client = monitoring_v3.MetricServiceClient(credentials=creds)
        else:
            self._client = monitoring_v3.MetricServiceClient()
        self._project_name = f"projects/{settings.firebase_project_id}"

    def _fetch_metric(
        self,
        metric_key: str,
        start_time: datetime,
        end_time: datetime,
        alignment_seconds: int,
    ) -> dict:
        """Synchronous fetch — called via asyncio.to_thread."""
        metric_type = METRIC_TYPES[metric_key]
        logger.debug(
            f"[monitoring] fetching {metric_key} | project={self._project_name} "
            f"| metric={metric_type} | start={start_time.isoformat()} end={end_time.isoformat()} "
            f"| alignment={alignment_seconds}s"
        )
        interval = monitoring_v3.TimeInterval(
            start_time=start_time,
            end_time=end_time,
        )
        aggregation = monitoring_v3.Aggregation(
            alignment_period={"seconds": alignment_seconds},
            per_series_aligner=monitoring_v3.Aggregation.Aligner.ALIGN_SUM,
            cross_series_reducer=monitoring_v3.Aggregation.Reducer.REDUCE_SUM,
            group_by_fields=[],
        )
        results = self._client.list_time_series(
            request={
                "name": self._project_name,
                "filter": (
                    f'metric.type = "{metric_type}"'
                    ' AND resource.type = "firestore_instance"'
                ),
                "interval": interval,
                "aggregation": aggregation,
                "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL,
            }
        )

        series: list[dict] = []
        total = 0
        for ts in results:
            for point in ts.points:
                end_time = point.interval.end_time
                # end_time may be a protobuf Timestamp (.seconds) or a
                # DatetimeWithNanoseconds (already a datetime subclass)
                if hasattr(end_time, "seconds"):
                    dt = datetime.fromtimestamp(end_time.seconds, tz=timezone.utc)
                else:
                    dt = end_time.astimezone(timezone.utc)
                val = int(point.value.int64_value or point.value.double_value or 0)
                series.append({"timestamp": dt.isoformat(), "value": val})
                total += val

        series.sort(key=lambda x: x["timestamp"])
        logger.debug(f"[monitoring] {metric_key} → {len(series)} points, total={total}")
        return {"total": total, "series": series}

    async def get_firestore_metrics(self, range_key: str) -> dict:
        cache_key = f"firestore_metrics:{range_key}"
        cached = _cache_get(cache_key)
        if cached is not None:
            logger.debug(f"[monitoring] cache hit for {cache_key}")
            return cached
        logger.debug(f"[monitoring] cache miss for {cache_key}, fetching from GCP")

        config = RANGE_CONFIG[range_key]
        now = datetime.now(timezone.utc)
        start_time = now - timedelta(minutes=config["minutes"])
        alignment_seconds = config["alignment_seconds"]

        reads, writes, deletes = await asyncio.gather(
            asyncio.to_thread(
                self._fetch_metric, "reads", start_time, now, alignment_seconds
            ),
            asyncio.to_thread(
                self._fetch_metric, "writes", start_time, now, alignment_seconds
            ),
            asyncio.to_thread(
                self._fetch_metric, "deletes", start_time, now, alignment_seconds
            ),
        )

        result = {"reads": reads, "writes": writes, "deletes": deletes}
        _cache_set(cache_key, result)
        return result


_monitoring_service: MonitoringService | None = None


def get_monitoring_service() -> MonitoringService:
    global _monitoring_service
    if _monitoring_service is None:
        _monitoring_service = MonitoringService()
    return _monitoring_service
