"""Rate limiting setup via SlowAPI."""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings


def create_limiter() -> Limiter:
    """Create a limiter using settings.rate_limit_per_minute as the default."""
    settings = get_settings()
    return Limiter(
        key_func=get_remote_address,
        default_limits=[f"{settings.rate_limit_per_minute}/minute"],
        headers_enabled=True,
    )


limiter = create_limiter()
