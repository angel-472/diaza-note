from datetime import datetime, timezone, timedelta

import asyncpg
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from pydantic import BaseModel, Field

from src.config import settings
from src.db import get_conn

ALGO = "HS256"
COOKIE = "session"
TTL = timedelta(days=30)

ph = PasswordHasher()
router = APIRouter(tags=["auth"])

# Verified against when the email is unknown, so that branch costs the same as a
# real check. Hashing a fresh string each time would also work but is slower.
DUMMY_HASH = ph.hash("dummy-password")


class LoginBody(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=1024)


def issue_session(response: Response, user_id: str) -> None:
    token = jwt.encode(
        {"sub": user_id, "exp": datetime.now(timezone.utc) + TTL},
        settings.jwt_secret,
        algorithm=ALGO,
    )
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
        max_age=int(TTL.total_seconds()),
    )


@router.post("/register")
async def register(
    body: LoginBody, response: Response, db: asyncpg.Connection = Depends(get_conn)
):
    try:
        user = await db.fetchrow(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
            body.email,
            ph.hash(body.password),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(409, "Email already registered")

    issue_session(response, user["id"])
    return {"ok": True}


@router.post("/login")
async def login(
    body: LoginBody, response: Response, db: asyncpg.Connection = Depends(get_conn)
):
    # lower() to match the unique index in 002_users.sql, so the address that
    # signed up is the address that can log in regardless of casing.
    user = await db.fetchrow(
        "SELECT id, password_hash FROM users WHERE lower(email) = lower($1)",
        body.email,
    )

    try:
        ph.verify(user["password_hash"] if user else DUMMY_HASH, body.password)
    except (VerifyMismatchError, VerificationError):
        raise HTTPException(401, "Bad credentials")
    if user is None:
        raise HTTPException(401, "Bad credentials")

    issue_session(response, user["id"])
    return {"ok": True}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE)
    return {"ok": True}


async def current_user(
    session: str | None = Cookie(default=None),
    db: asyncpg.Connection = Depends(get_conn),
):
    if session is None:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(session, settings.jwt_secret, algorithms=[ALGO])
    except jwt.PyJWTError:
        raise HTTPException(401, "Not authenticated")

    user = await db.fetchrow(
        "SELECT id, email FROM users WHERE id = $1", payload["sub"]
    )
    if user is None:
        raise HTTPException(401, "Not authenticated")
    return user


@router.get("/me")
async def me(user=Depends(current_user)):
    return {"id": user["id"], "email": user["email"]}