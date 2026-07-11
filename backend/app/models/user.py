"""User document — maps to the Users MongoDB collection."""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr, Field

from app.models.enums import UserRole


class User(Document):
    """Authenticated hospital staff account."""

    email: Indexed(EmailStr, unique=True)  # type: ignore[valid-type]
    hashed_password: str
    full_name: str = Field(..., min_length=2, max_length=120)
    role: UserRole
    is_active: bool = True
    department: Optional[str] = Field(default=None, max_length=80)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = ["role", "is_active"]

    def touch(self) -> None:
        """Update the updated_at timestamp."""
        self.updated_at = datetime.now(timezone.utc)
