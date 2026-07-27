import logging
import os

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

logger = logging.getLogger(__name__)


class SupabaseConfigError(RuntimeError):
    """Raised when Supabase environment configuration is missing or invalid."""


def _get_required_env(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise SupabaseConfigError(f"Missing required environment variable: {name}")

    return value


def init_supabase_client() -> Client:
    """Initialize and return a Supabase client from environment variables."""
    supabase_url = _get_required_env("SUPABASE_URL")
    supabase_key = _get_required_env("SUPABASE_KEY")

    try:
        return create_client(supabase_url, supabase_key)
    except Exception as exc:
        logger.exception("Failed to initialize Supabase client")
        raise SupabaseConfigError("Could not initialize Supabase client") from exc


supabase: Client = init_supabase_client()
