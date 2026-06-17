from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.clerk import get_current_user_id
from app.core.database import get_db
from app.models.post import Comment, Post, Reaction
from app.models.property import Property
from app.routers.users import get_user_or_404
from app.schemas.post import CommentOut, PostCreate, PostOut, ReactionCreate

router = APIRouter(prefix="/feed", tags=["feed"])


async def _neighborhood_id_for_user(clerk_id: str, db: AsyncSession) -> UUID:
    user = await get_user_or_404(clerk_id, db)
    result = await db.execute(
        select(Property).where(Property.user_id == user.id, Property.neighborhood_id.isnot(None)).limit(1)
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No verified neighborhood found. Complete onboarding first.")
    return prop.neighborhood_id


@router.get("", response_model=list[PostOut])
async def get_feed(
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    hood_id = await _neighborhood_id_for_user(clerk_id, db)
    result = await db.execute(
        select(Post)
        .where(Post.neighborhood_id == hood_id, Post.deleted_at.is_(None))
        .options(selectinload(Post.author), selectinload(Post.media), selectinload(Post.reactions))
        .order_by(Post.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    posts = result.scalars().all()

    out = []
    for p in posts:
        comment_count_result = await db.execute(select(func.count()).where(Comment.post_id == p.id, Comment.deleted_at.is_(None)))
        comment_count = comment_count_result.scalar() or 0
        reaction_counts: dict[str, int] = {}
        for r in p.reactions:
            reaction_counts[r.type] = reaction_counts.get(r.type, 0) + 1
        po = PostOut.model_validate(p)
        po.comment_count = comment_count
        po.reaction_counts = reaction_counts
        out.append(po)
    return out


@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post(
    body: PostCreate,
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_or_404(clerk_id, db)
    hood_id = await _neighborhood_id_for_user(clerk_id, db)
    post = Post(author_id=user.id, neighborhood_id=hood_id, **body.model_dump())
    db.add(post)
    await db.commit()
    await db.refresh(post)
    result = await db.execute(select(Post).where(Post.id == post.id).options(selectinload(Post.author), selectinload(Post.media)))
    return result.scalar_one()


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: UUID, clerk_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await get_user_or_404(clerk_id, db)
    result = await db.execute(select(Post).where(Post.id == post_id, Post.author_id == user.id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.deleted_at = func.now()
    await db.commit()


@router.get("/{post_id}/comments", response_model=list[CommentOut])
async def get_comments(post_id: UUID, db: AsyncSession = Depends(get_db), _: str = Depends(get_current_user_id)):
    result = await db.execute(
        select(Comment)
        .where(Comment.post_id == post_id, Comment.parent_id.is_(None), Comment.deleted_at.is_(None))
        .options(selectinload(Comment.author), selectinload(Comment.replies).selectinload(Comment.author))
        .order_by(Comment.created_at.asc())
    )
    return result.scalars().all()


@router.post("/{post_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: UUID,
    body: str,
    parent_id: UUID | None = None,
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_or_404(clerk_id, db)
    comment = Comment(post_id=post_id, author_id=user.id, body=body, parent_id=parent_id)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    result = await db.execute(select(Comment).where(Comment.id == comment.id).options(selectinload(Comment.author)))
    return result.scalar_one()


@router.post("/{post_id}/reactions", status_code=status.HTTP_204_NO_CONTENT)
async def react(
    post_id: UUID,
    body: ReactionCreate,
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_or_404(clerk_id, db)
    existing = await db.execute(select(Reaction).where(Reaction.post_id == post_id, Reaction.user_id == user.id))
    reaction = existing.scalar_one_or_none()
    if reaction:
        reaction.type = body.type
    else:
        db.add(Reaction(post_id=post_id, user_id=user.id, type=body.type))
    await db.commit()
