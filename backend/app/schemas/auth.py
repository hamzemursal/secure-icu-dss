"""Authentication request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole


class LoginRequest(BaseModel):
    """Credentials for staff login."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    """Public staff registration (doctor or nurse only)."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=120)
    role: UserRole = UserRole.NURSE
    department: Optional[str] = Field(default=None, max_length=80)


class TokenResponse(BaseModel):
    """JWT access token payload returned after successful login."""

    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class UserPublic(BaseModel):
    """Safe user profile for API responses (no password hash)."""

    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    department: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None


class LoginResponse(BaseModel):
    """Login success — token + current user profile."""

    token: TokenResponse
    user: UserPublic


class MessageResponse(BaseModel):
    """Generic success/info message."""

    message: str
