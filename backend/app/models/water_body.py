import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Enum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

WaterBodyType = Enum("lake", "river", "bay", "canal", "ocean", "pond", name="water_body_type")


class WaterBody(Base):
    __tablename__ = "water_bodies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str] = mapped_column(WaterBodyType, nullable=False)
    polygon: Mapped[object | None] = mapped_column(Geometry("MULTIPOLYGON", srid=4326))
    state: Mapped[str | None] = mapped_column(String(50))
    country: Mapped[str] = mapped_column(String(50), default="US")

    neighborhoods: Mapped[list["Neighborhood"]] = relationship("Neighborhood", back_populates="water_body")
