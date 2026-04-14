#!/usr/bin/env python
"""
Seed script: populate Firestore with fake credit transactions for demo/testing.

Usage:
    python scripts/seed_credits.py --user-id <USER_ID> [--project-id <PROJECT_ID>]
    python scripts/seed_credits.py --user-id <USER_ID> --days 30 --count 200

The user-id must match an existing Mithril user in Firestore.
"""

import argparse
import asyncio
import random
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Allow importing from app/
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.firestore import get_db
from google.cloud import firestore

# ---------------------------------------------------------------------------
# Cost table — mirrors CREDIT_COST_TABLE in app/services/credits.py
# ---------------------------------------------------------------------------

COST_TABLE: dict[tuple[str, str], float] = {
    ("video", "sora"): 0.20,
    ("video", "veo3"): 0.35,
    ("video", "grok_i2v"): 0.15,
    ("video", "grok_imagine_i2v"): 0.15,
    ("video", "wan_i2v"): 0.05,
    ("video", "wan22_i2v"): 0.05,
    ("image", "gemini"): 0.04,
    ("background", "gemini"): 0.04,
    ("prop_design_sheet", "gemini"): 0.04,
    ("panel", "gemini"): 0.04,
    ("panel", "grok"): 0.04,
    ("panel", "z_image_turbo"): 0.02,
    ("panel_colorizer", "gemini"): 0.04,
    ("panel_colorizer", "grok"): 0.04,
    ("panel_colorizer", "z_image_turbo"): 0.02,
    ("style_converter", "pixai"): 0.01,
    ("storyboard", "gemini"): 0.02,
    ("i2v_storyboard", "gemini"): 0.02,
    ("storyboard_editor", "gemini"): 0.04,
    ("story_splitter", "gemini"): 0.02,
    ("id_converter_glossary", "gemini"): 0.02,
    ("id_converter_batch", "gemini"): 0.01,
    ("panel_splitter", "gemini"): 0.01,
}

# Weighted distribution — video is expensive but less frequent;
# panel/image calls are cheap but high volume.
COMBO_WEIGHTS: dict[tuple[str, str], int] = {
    ("video", "veo3"): 5,
    ("video", "sora"): 8,
    ("video", "grok_i2v"): 6,
    ("video", "wan_i2v"): 10,
    ("panel", "gemini"): 30,
    ("panel", "grok"): 20,
    ("panel", "z_image_turbo"): 15,
    ("panel_colorizer", "gemini"): 20,
    ("panel_colorizer", "grok"): 15,
    ("image", "gemini"): 25,
    ("background", "gemini"): 15,
    ("storyboard", "gemini"): 20,
    ("storyboard_editor", "gemini"): 10,
    ("story_splitter", "gemini"): 12,
    ("style_converter", "pixai"): 18,
    ("panel_splitter", "gemini"): 10,
    ("id_converter_batch", "gemini"): 8,
    ("i2v_storyboard", "gemini"): 8,
}

COMBOS = list(COMBO_WEIGHTS.keys())
WEIGHTS = [COMBO_WEIGHTS[c] for c in COMBOS]


def random_iso(days_back: int) -> str:
    """Return a random ISO 8601 UTC timestamp within the last N days."""
    delta_seconds = random.randint(0, days_back * 86400)
    dt = datetime.now(timezone.utc) - timedelta(seconds=delta_seconds)
    return dt.isoformat()


def fake_project_id() -> str:
    return f"proj_{uuid.uuid4().hex[:8]}"


async def seed(
    user_id: str,
    project_ids: list[str],
    count: int,
    days: int,
) -> None:
    db = get_db()
    TRANSACTIONS = "credit_transactions"
    USER_CREDITS = "user_credits"

    print(f"Seeding {count} transactions for user '{user_id}' "
          f"across {len(project_ids)} project(s) over the last {days} days...\n")

    total_cost = 0.0
    batches_written = 0

    # Firestore batch limit is 500 ops; use 400 to stay safe
    BATCH_SIZE = 400
    batch = db.batch()
    ops = 0

    for i in range(count):
        job_type, provider_id = random.choices(COMBOS, weights=WEIGHTS, k=1)[0]
        cost_usd = COST_TABLE.get((job_type, provider_id), 0.01)
        project_id = random.choice(project_ids)
        transaction_id = str(uuid.uuid4())
        created_at = random_iso(days)

        tx_data = {
            "id": transaction_id,
            "user_id": user_id,
            "project_id": project_id,
            "job_id": f"job_{uuid.uuid4().hex[:12]}",
            "job_type": job_type,
            "provider_id": provider_id,
            "cost_usd": cost_usd,
            "created_at": created_at,
        }

        tx_ref = db.collection(TRANSACTIONS).document(transaction_id)
        batch.set(tx_ref, tx_data)
        ops += 1
        total_cost += cost_usd

        if ops >= BATCH_SIZE:
            await batch.commit()
            batches_written += 1
            print(f"  Wrote batch {batches_written} ({i + 1}/{count} transactions)")
            batch = db.batch()
            ops = 0

    # Commit remaining
    if ops > 0:
        await batch.commit()
        batches_written += 1
        print(f"  Wrote batch {batches_written} ({count}/{count} transactions)")

    # Update user summary document
    user_ref = db.collection(USER_CREDITS).document(user_id)
    await user_ref.set(
        {
            "user_id": user_id,
            "total_used_usd": firestore.Increment(total_cost),
            "transaction_count": firestore.Increment(count),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        },
        merge=True,
    )

    print(f"\nDone.")
    print(f"  Transactions written : {count}")
    print(f"  Total cost seeded    : ${total_cost:.4f}")
    print(f"  Projects used        : {project_ids}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed fake credit transactions into Firestore.")
    parser.add_argument("--user-id", required=True, help="Mithril user ID to seed data for")
    parser.add_argument(
        "--project-id",
        action="append",
        dest="project_ids",
        metavar="PROJECT_ID",
        help="Project ID to use (can be specified multiple times). Defaults to 3 random IDs.",
    )
    parser.add_argument("--count", type=int, default=150, help="Number of transactions to generate (default: 150)")
    parser.add_argument("--days", type=int, default=30, help="Spread transactions over this many past days (default: 30)")

    args = parser.parse_args()

    project_ids = args.project_ids or [fake_project_id() for _ in range(3)]

    asyncio.run(seed(
        user_id=args.user_id,
        project_ids=project_ids,
        count=args.count,
        days=args.days,
    ))


if __name__ == "__main__":
    main()