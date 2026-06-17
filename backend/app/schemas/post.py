import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

PostCategoryLiteral = Literal["general", "safety", "lost_found", "events", "recommendations", "for_sale", "water_conditions"]
ReactionTypeLiteral = Literal["like", "helpful", "thanks"]


class PostCreate(BaseModel):
    body: str
    category: PostCategoryLiteral = "general"
    is_urgent: bool = False


class PostMediaOut(BaseModel):
    id: uuid.UUID
    url: str
    mime_type: str
    position: int

    model_config = {"from_attributes": True}


class AuthorSnippet(BaseModel):
    id: uuid.UUID
    display_name: str
    avatar_url: str | None

    model_config = {"from_attributes": True}


class CommentOut(BaseModel):
    id: uuid.UUID
    author: AuthorSnippet
    body: str
    parent_id: uuid.UUID | None
    created_at: datetime
    replies: list["CommentOut"] = []

    model_config = {"from_attributes": True}


class PostOut(BaseModel):
    id: uuid.UUID
    author: AuthorSnippet
    neighborhood_id: uuid.UUID
    category: str
    body: str
    is_urgent: bool
    created_at: datetime
    media: list[PostMediaOut] = []
    comment_count: int = 0
    reaction_counts: dict[str, int] = {}

    model_config = {"from_attributes": True}


class ReactionCreate(BaseModel):
    type: ReactionTypeLiteral
