import uuid
from datetime import datetime

from pydantic import BaseModel


class PropertyCreate(BaseModel):
    address_line1: str
    address_line2: str | None = None
    city: str
    state: str
    zip_code: str
    country: str = "US"
    lat: float | None = None
    lng: float | None = None


class PropertyOut(BaseModel):
    id: uuid.UUID
    address_line1: str
    address_line2: str | None
    city: str
    state: str
    zip_code: str
    lat: float | None
    lng: float | None
    is_primary: bool
    is_verified: bool
    verified_at: datetime | None
    neighborhood_id: uuid.UUID | None

    model_config = {"from_attributes": True}
