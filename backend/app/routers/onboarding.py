"""Onboarding flow — called after Clerk sign-up to complete profile + property."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clerk import get_current_user_id
from app.core.database import get_db
from app.routers.properties import add_property
from app.routers.users import get_user_or_404
from app.schemas.property import PropertyCreate, PropertyOut
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


class OnboardingPayload(UserUpdate):
    property: PropertyCreate


class OnboardingOut(UserOut):
    property: PropertyOut


@router.post("/complete", response_model=OnboardingOut)
async def complete_onboarding(
    body: OnboardingPayload,
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_or_404(clerk_id, db)

    for field, value in body.model_dump(exclude={"property"}, exclude_none=True).items():
        setattr(user, field, value)

    prop = await add_property(body.property, clerk_id, db)

    user.onboarding_complete = True
    await db.commit()
    await db.refresh(user)

    return {**user.__dict__, "property": prop}
