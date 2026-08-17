"""Password hashing and JWT access-token utilities.

Kept free of any database/repository concerns so it can be unit tested in
isolation and reused by any service that needs to hash a password or mint
a token.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import Settings

JWT_SUBJECT_CLAIM = "sub"
JWT_EXPIRY_CLAIM = "exp"


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password with bcrypt. Never store the plain password."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a plain-text password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        # Malformed hash (e.g. legacy/corrupt data) — treat as a failed match, not a crash.
        return False


def create_access_token(subject: str, settings: Settings) -> str:
    """Create a signed JWT access token whose subject is the user id (as a string)."""
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {JWT_SUBJECT_CLAIM: subject, JWT_EXPIRY_CLAIM: expire_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str, settings: Settings) -> str:
    """Decode and validate a JWT access token, returning its subject (user id).

    Raises jwt.PyJWTError (or a subclass) on any invalid/expired/tampered token —
    callers are expected to translate that into an HTTP 401.
    """
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    return payload[JWT_SUBJECT_CLAIM]
