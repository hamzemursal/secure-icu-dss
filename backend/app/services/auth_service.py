"""Authentication business logic."""

from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.config import get_settings
from app.models import User, UserRole
from app.schemas.auth import LoginResponse, RegisterRequest, TokenResponse, UserPublic
from app.utils.security import create_access_token, hash_password, verify_password


def user_to_public(user: User) -> UserPublic:
    """Map a User document to a public schema."""
    return UserPublic(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        department=user.department,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


async def register_user(payload: RegisterRequest) -> LoginResponse:
    """Create a new doctor/nurse account and issue a JWT."""
    if payload.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin accounts cannot be self-registered",
        )
    if payload.role not in {UserRole.DOCTOR, UserRole.NURSE}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be doctor or nurse",
        )

    email = payload.email.lower()
    existing = await User.find_one(User.email == email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        department=payload.department.strip() if payload.department else None,
        is_active=True,
    )
    await user.insert()

    # Auto-login after registration
    return await authenticate_user(email, payload.password)


async def authenticate_user(email: str, password: str) -> LoginResponse:
    """Validate credentials and issue a JWT."""
    user = await User.find_one(User.email == email.lower())
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an administrator.",
        )

    settings = get_settings()
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
        extra_claims={"email": user.email, "name": user.full_name},
    )

    user.last_login_at = datetime.now(timezone.utc)
    user.touch()
    await user.save()

    return LoginResponse(
        token=TokenResponse(
            access_token=access_token,
            expires_in_minutes=settings.access_token_expire_minutes,
        ),
        user=user_to_public(user),
    )


async def get_user_by_id(user_id: str) -> User:
    """Load an active user by id or raise 401."""
    user = await User.get(user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# Demo accounts for academic evaluation (seeded once on startup).
SEED_USERS: list[dict] = [
    {
        "email": "admin@example.com",
        "password": "Admin@12345",
        "full_name": "System Administrator",
        "role": UserRole.ADMIN,
        "department": "IT Security",
    },
    {
        "email": "doctor@example.com",
        "password": "Doctor@12345",
        "full_name": "Dr. Aisha Rahman",
        "role": UserRole.DOCTOR,
        "department": "ICU",
    },
    {
        "email": "nurse@example.com",
        "password": "Nurse@12345",
        "full_name": "Nurse Priya Sharma",
        "role": UserRole.NURSE,
        "department": "ICU",
    },
]


async def seed_default_users() -> None:
    """Create demo Admin / Doctor / Nurse accounts if missing."""
    for entry in SEED_USERS:
        existing = await User.find_one(User.email == entry["email"])
        if existing is not None:
            continue
        user = User(
            email=entry["email"],
            hashed_password=hash_password(entry["password"]),
            full_name=entry["full_name"],
            role=entry["role"],
            department=entry["department"],
        )
        await user.insert()
