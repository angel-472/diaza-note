from datetime import datetime

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from src.db import get_conn
from src.auth import current_user

router = APIRouter(prefix="/notes", tags=["notes"])

NOTE_COLUMNS = """
    note_id, title, content, category_ids, excerpt,
    is_pinned, created_at, updated_at, server_seq
"""


class Note(BaseModel):
    """Mirrors the client's `Note` type, so the wire format is camelCase."""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str = ""
    content: str = ""
    category_ids: list[str] = Field(default_factory=list, alias="categoryIds")
    excerpt: str = ""
    is_pinned: bool = Field(default=False, alias="isPinned")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")


# converts the snake_case column names from the database to camelCase for the API response
def to_note(row: asyncpg.Record) -> dict:
    return {
        "id": row["note_id"],
        "title": row["title"],
        "content": row["content"],
        "categoryIds": list(row["category_ids"]),
        "excerpt": row["excerpt"],
        "isPinned": row["is_pinned"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "serverSeq": row["server_seq"],
    }


@router.get("/{note_id}")
async def read_note(note_id: str, user=Depends(current_user), conn: asyncpg.Connection = Depends(get_conn)):
    row = await conn.fetchrow(
        f"SELECT {NOTE_COLUMNS} FROM notes"
        " WHERE note_id = $1 AND user_id = $2 AND deleted_at IS NULL",
        note_id,
        user["id"],
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return to_note(row)


@router.put("/{note_id}")
async def upsert_note(
    note_id: str, note: Note, user=Depends(current_user), conn: asyncpg.Connection = Depends(get_conn)
):
    if note.id != note_id:
        raise HTTPException(
            status_code=400, detail="Body id does not match the path note_id"
        )

    row = await conn.fetchrow(
        """
        INSERT INTO notes (note_id, user_id, title, content, category_ids,
                           excerpt, is_pinned, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (note_id) DO UPDATE SET
            title        = EXCLUDED.title,
            content      = EXCLUDED.content,
            category_ids = EXCLUDED.category_ids,
            excerpt      = EXCLUDED.excerpt,
            is_pinned    = EXCLUDED.is_pinned,
            updated_at   = EXCLUDED.updated_at,
            -- A newer edit of a deleted note revives it, which is just
            -- last-write-wins applied to the tombstone.
            deleted_at   = NULL
        -- Last-write-wins. A stale push writes nothing, so the trigger never
        -- fires and the note keeps its place in the change queue.
        WHERE notes.updated_at < EXCLUDED.updated_at
        RETURNING server_seq
        """,
        note_id,
        user["id"],
        note.title,
        note.content,
        note.category_ids,
        note.excerpt,
        note.is_pinned,
        note.created_at,
        note.updated_at,
    )

    # No row back means the conflict target existed and the LWW guard rejected
    # the write: the client is behind and should pull before pushing again.
    if row is None:
        return {"applied": False, "serverSeq": None}
    return {"applied": True, "serverSeq": row["server_seq"]}
