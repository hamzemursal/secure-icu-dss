"""Authentication routes — register, login, logout, current profile."""

from fastapi import APIRouter, status

from app.api.deps import CurrentUser
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MessageResponse,
    RegisterRequest,
    UserPublic,
)
from app.services.auth_service import authenticate_user, register_user, user_to_public

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=LoginResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create staff account",
)
async def register(body: RegisterRequest) -> LoginResponse:
    """Public registration for doctor or nurse roles (not admin)."""
    return await register_user(body)


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Staff login",
)
async def login(body: LoginRequest) -> LoginResponse:
    """Authenticate with email/password and receive a JWT."""
    return await authenticate_user(body.email.lower(), body.password)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Staff logout",
)
async def logout(_current_user: CurrentUser) -> MessageResponse:
    """
    Stateless JWT logout — client must discard the token.
    Endpoint requires a valid token so logout is auditable later.
    """
    return MessageResponse(message="Logged out successfully. Discard the access token.")


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Current user profile",
)
async def me(current_user: CurrentUser) -> UserPublic:
    """Return the authenticated user's public profile."""
    return user_to_public(current_user)
