import logging
import os

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

logger = logging.getLogger(__name__)


class SupabaseConfigError(RuntimeError):
    """Raised when Supabase environment configuration is missing or invalid."""


def _get_env_key() -> str:
    # Prefer service role key for backend operations to bypass RLS restrictions
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    if not key:
        raise SupabaseConfigError(
            "Missing environment variable: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY"
        )
    return key


def init_supabase_client() -> Client:
    """Initialize and return a Supabase client from environment variables."""
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        raise SupabaseConfigError("Missing required environment variable: SUPABASE_URL")

    supabase_key = _get_env_key()

    try:
        return create_client(supabase_url, supabase_key)
    except Exception as exc:
        logger.exception("Failed to initialize Supabase client")
        raise SupabaseConfigError("Could not initialize Supabase client") from exc


supabase: Client = init_supabase_client()