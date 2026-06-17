"""Clerk webhook handler — syncs user lifecycle events to our DB."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clerk import verify_webhook
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/clerk")
async def clerk_webhook(event: dict = Depends(verify_webhook), db: AsyncSession = Depends(get_db)):
    event_type = event.get("type")
    data = event.get("data", {})

    if event_type == "user.created":
        email = next((e["email_address"] for e in data.get("email_addresses", []) if e["id"] == data.get("primary_email_address_id")), "")
        user = User(
            clerk_id=data["id"],
            email=email,
            display_name=f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or email.split("@")[0],
            avatar_url=data.get("image_url"),
        )
        db.add(user)
        await db.commit()

    elif event_type == "user.updated":
        result = await db.execute(select(User).where(User.clerk_id == data["id"]))
        user = result.scalar_one_or_none()
        if user:
            email = next((e["email_address"] for e in data.get("email_addresses", []) if e["id"] == data.get("primary_email_address_id")), user.email)
            user.email = email
            user.display_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip() or user.display_name
            user.avatar_url = data.get("image_url", user.avatar_url)
            await db.commit()

    elif event_type == "user.deleted":
        result = await db.execute(select(User).where(User.clerk_id == data["id"]))
        user = result.scalar_one_or_none()
        if user:
            user.is_active = False
            await db.commit()

    return {"status": "ok"}
