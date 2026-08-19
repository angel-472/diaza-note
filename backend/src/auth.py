from datetime import datetime, timezone, timedelta

import asyncpg
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from fastapi import APIRouter, Depends, Header, HTTPException, Response, Cookie
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
    """No length policy: a short password here is a failed login (401), not a
    malformed request (422). Enforcing the rule on this route would also tell
    anyone probing it what the policy is."""

    email: str = Field(min_length=3, max_length=320)
    # Capped only to stop a huge body from reaching argon2, which is
    # deliberately slow and would otherwise be an easy way to burn CPU.
    password: str = Field(max_length=1024)


class RegisterBody(LoginBody):
    """Where the policy does belong: it is the moment the password is chosen."""

    password: str = Field(min_length=8, max_length=1024)


def issue_session(response: Response, user_id: str) -> dict:
    """Mint a token, return it for the caller, and mirror it into a cookie.

    External services read the token out of the body and send it back as a
    Bearer header. The cookie is kept for first-party browser use; SameSite
    still confines it to this site, so opening CORS does not expose it.
    """
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
    return {
        "ok": True,
        "token": token,
        "tokenType": "Bearer",
        "expiresIn": int(TTL.total_seconds()),
    }


@router.post("/register")
async def register(
    body: RegisterBody, response: Response, db: asyncpg.Connection = Depends(get_conn)
):
    try:
        user = await db.fetchrow(
            "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
            body.email,
            ph.hash(body.password),
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(409, "Email already registered")

    return issue_session(response, user["id"])


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

    return issue_session(response, user["id"])


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(COOKIE)
    return {"ok": True}


async def current_user(
    session: str | None = Cookie(default=None),
    authorization: str | None = Header(default=None),
    db: asyncpg.Connection = Depends(get_conn),
):
    # Header first: an external service sends only this, while a browser on the
    # same site may send both and should not have the cookie override an
    # explicitly supplied token.
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif session is not None:
        token = session

    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[ALGO])
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