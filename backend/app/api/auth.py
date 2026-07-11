"""Authentication routes — login, logout, profile, admin user provisioning."""

from fastapi import APIRouter, status

from app.api.deps import AdminUser, CurrentUser
from app.schemas.auth import (
    CreateUserRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    UserPublic,
)
from app.services.auth_service import (
    authenticate_user,
    create_user_by_admin,
    list_users,
    user_to_public,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    summary="Staff login",
)
async def login(body: LoginRequest) -> LoginResponse:
    """Authenticate with email/password issued by an administrator."""
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


@router.get(
    "/users",
    response_model=list[UserPublic],
    summary="List staff accounts (admin)",
)
async def get_users(_admin: AdminUser) -> list[UserPublic]:
    """List all provisioned staff — admin only."""
    return await list_users()


@router.post(
    "/users",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create staff account (admin)",
)
async def create_user(body: CreateUserRequest, _admin: AdminUser) -> UserPublic:
    """
    Provision a new staff account with an email chosen by the admin.
    Public self-registration is disabled.
    """
    return await create_user_by_admin(body)
