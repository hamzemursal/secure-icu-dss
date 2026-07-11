"""MongoDB connection via Motor + Beanie ODM."""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from app.config import get_settings
from app.models import AttackLog, AuditLog, MedicalRecord, Patient, Recommendation, User

_client: AsyncIOMotorClient | None = None


async def connect_to_mongo() -> None:
    """Open MongoDB connection and initialize Beanie document models."""
    global _client
    settings = get_settings()
    _client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=8_000,
    )
    await _client.admin.command("ping")
    database = _client[settings.mongodb_db_name]

    await init_beanie(
        database=database,
        document_models=[
            User,
            Patient,
            MedicalRecord,
            Recommendation,
            AuditLog,
            AttackLog,
        ],
    )


async def close_mongo_connection() -> None:
    """Close the MongoDB client on application shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_client() -> AsyncIOMotorClient:
    """Return the active Motor client (raises if not connected)."""
    if _client is None:
        raise RuntimeError("MongoDB client is not initialized. Call connect_to_mongo() first.")
    return _client
