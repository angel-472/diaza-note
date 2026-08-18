from contextlib import asynccontextmanager
from pathlib import Path

import asyncpg
from fastapi import FastAPI

from src.config import settings

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent / "migrations"

pool: asyncpg.Pool | None = None


async def migrate(conn: asyncpg.Connection):
    """Apply any migration files this database has not seen yet.

    A no-op once everything is applied, so it is safe on every startup.
    """
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version    text PRIMARY KEY,
            applied_at timestamptz NOT NULL DEFAULT now()
        )
    """)
    applied = {
        row["version"]
        for row in await conn.fetch("SELECT version FROM schema_migrations")
    }
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        if path.stem in applied:
            continue
        # One transaction per file, so a migration that fails partway rolls
        # back rather than leaving the schema half-applied.
        async with conn.transaction():
            await conn.execute(path.read_text())
            await conn.execute(
                "INSERT INTO schema_migrations (version) VALUES ($1)", path.stem
            )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = await asyncpg.create_pool(
        settings.database_url,
        min_size=1,
        max_size=10,
    )
    async with pool.acquire() as conn:
        await migrate(conn)
    yield
    await pool.close()


async def get_conn():
    async with pool.acquire() as conn:
        yield conn
