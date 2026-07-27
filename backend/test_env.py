import os
from dotenv import load_dotenv

load_dotenv()

print("Supabase URL loaded:", os.getenv("SUPABASE_URL"))