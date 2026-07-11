"""FastAPI dependencies — auth and RBAC."""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.models import User, UserRole
from app.services.auth_service import get_user_by_id
from app.utils.security import TokenDecodeError, safe_decode_access_token

bearer_scheme = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> User:
    """Resolve the authenticated user from the Bearer JWT."""
    try:
        payload = safe_decode_access_token(credentials.credentials)
    except TokenDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return await get_user_by_id(payload["sub"])


def require_roles(*allowed_roles: UserRole) -> Callable:
    """Dependency factory — restrict an endpoint to specific roles."""

    async def _checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted for this action",
            )
        return current_user

    return _checker


CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]
DoctorUser = Annotated[User, Depends(require_roles(UserRole.DOCTOR, UserRole.ADMIN))]
ClinicianUser = Annotated[
    User, Depends(require_roles(UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN))
]
