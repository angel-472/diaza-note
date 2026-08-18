import asyncpg
from fastapi import APIRouter, Depends

from src.db import get_conn

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/{note_id}")
async def read_notes(note_id: str, conn: asyncpg.Connection = Depends(get_conn)):
    row = await conn.fetchrow("SELECT * FROM notes WHERE note_id = $1", note_id)
    if row is None:
        return {"error": "Note not found"}
    return [{"note_id": note_id, "note": row["note"]}]
