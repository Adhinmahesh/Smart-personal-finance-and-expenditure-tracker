import time
import psycopg2
from psycopg2 import pool, OperationalError
from config import Config
import logging

logger = logging.getLogger(__name__)

# Initialize connection pool (min 2, max 10 connections)
try:
    connection_pool = pool.ThreadedConnectionPool(
        2, 10,
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD
    )
    logger.info("ShaktiDB connection pool initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize ShaktiDB connection pool: {e}")
    connection_pool = None

from typing import Any

def get_connection() -> Any:
    if not connection_pool:
        raise Exception("Database connection pool is not initialized.")
    
    max_retries = 3
    backoff = 0.1
    for attempt in range(1, max_retries + 1):
        try:
            return connection_pool.getconn()
        except (OperationalError, pool.PoolError) as e:
            if attempt == max_retries:
                logger.error(f"Database connection pool exhausted or unreachable after {max_retries} attempts: {e}")
                raise e
            logger.warning(f"Database connection error (attempt {attempt}/{max_retries}): {e}. Retrying in {backoff}s...")
            time.sleep(backoff)
            backoff *= 2
    raise RuntimeError("Failed to connect to database.")

def release_connection(conn):
    if connection_pool and conn:
        try:
            connection_pool.putconn(conn)
        except Exception as e:
            logger.error(f"Error releasing DB connection: {e}")

def close_all():
    if connection_pool:
        connection_pool.closeall()
