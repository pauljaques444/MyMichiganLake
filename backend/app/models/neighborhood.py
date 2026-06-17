import uuid

from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Neighborhood(Base):
    __tablename__ = "neighborhoods"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    water_body_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("water_bodies.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    boundary: Mapped[object | None] = mapped_column(Geometry("POLYGON", srid=4326))

    water_body: Mapped["WaterBody"] = relationship("WaterBody", back_populates="neighborhoods")
    properties: Mapped[list["Property"]] = relationship("Property", back_populates="neighborhood")
    posts: Mapped[list["Post"]] = relationship("Post", back_populates="neighborhood")
