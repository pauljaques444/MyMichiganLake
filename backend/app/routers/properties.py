from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.functions import ST_SetSRID, ST_MakePoint, ST_Within
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clerk import get_current_user_id
from app.core.database import get_db
from app.models.neighborhood import Neighborhood
from app.models.property import Property
from app.models.user import User
from app.routers.users import get_user_or_404
from app.schemas.property import PropertyCreate, PropertyOut

router = APIRouter(prefix="/properties", tags=["properties"])


async def _assign_neighborhood(db: AsyncSession, prop: Property) -> None:
    """Find the neighborhood whose boundary contains this property's location."""
    if prop.lat is None or prop.lng is None:
        return
    point = ST_SetSRID(ST_MakePoint(float(prop.lng), float(prop.lat)), 4326)
    result = await db.execute(
        select(Neighborhood).where(ST_Within(point, Neighborhood.boundary))
    )
    hood = result.scalar_one_or_none()
    if hood:
        prop.neighborhood_id = hood.id


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
async def add_property(
    body: PropertyCreate,
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_or_404(clerk_id, db)
    point = None
    if body.lat and body.lng:
        point = f"SRID=4326;POINT({body.lng} {body.lat})"

    prop = Property(
        user_id=user.id,
        address_line1=body.address_line1,
        address_line2=body.address_line2,
        city=body.city,
        state=body.state,
        zip_code=body.zip_code,
        country=body.country,
        lat=body.lat,
        lng=body.lng,
        location=point,
    )
    db.add(prop)
    await db.flush()
    await _assign_neighborhood(db, prop)
    await db.commit()
    await db.refresh(prop)
    return prop


@router.get("/me", response_model=list[PropertyOut])
async def my_properties(clerk_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await get_user_or_404(clerk_id, db)
    result = await db.execute(select(Property).where(Property.user_id == user.id))
    return result.scalars().all()


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: str,
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_or_404(clerk_id, db)
    result = await db.execute(select(Property).where(Property.id == property_id, Property.user_id == user.id))
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")
    await db.delete(prop)
    await db.commit()
