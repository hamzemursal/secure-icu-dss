"""Database package — MongoDB connection and Beanie setup."""

from app.database.connection import (
    close_mongo_connection,
    connect_to_mongo,
    get_client,
)

__all__ = ["connect_to_mongo", "close_mongo_connection", "get_client"]
