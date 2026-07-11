"""
FastAPI application entry point.

Bootstraps CORS, security headers, rate limiting, lifespan, health, API v1.
"""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import api_router
from app.config import get_settings
from app.database import close_mongo_connection, connect_to_mongo
from app.middleware import SecurityHeadersMiddleware, limiter
from app.services.auth_service import seed_default_users


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Connect to MongoDB, seed demo users, then disconnect on shutdown."""
    await connect_to_mongo()
    await seed_default_users()
    yield
    await close_mongo_connection()


def create_app() -> FastAPI:
    """Application factory — keeps configuration testable and explicit."""
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        description=(
            "Agentic ICU decision support with prompt-injection defense "
            "and human-in-the-loop validation. Recommendations only — "
            "final medical decisions belong to clinicians."
        ),
        version="0.6.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    application.add_middleware(SlowAPIMiddleware)
    application.add_middleware(SecurityHeadersMiddleware)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get("/health", tags=["System"])
    async def health_check() -> dict[str, str]:
        """Liveness probe for Render / local checks."""
        return {
            "status": "ok",
            "service": settings.app_name,
            "env": settings.app_env,
        }

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    return application


app = create_app()
