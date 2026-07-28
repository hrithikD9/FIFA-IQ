import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, predictions, teams

load_dotenv()


def _get_cors_origins() -> list[str]:
    """Build the allowed-origins list from the CORS_ORIGINS env var.

    Accepts a comma-separated string (e.g. "https://app.example.com,http://localhost:5173").
    Falls back to common local development origins when the variable is unset so
    the backend works out of the box while staying configurable for production.
    """
    raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["http://localhost:5173"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n" + "="*50)
    print("=== REGISTERED ROUTES ===")
    for route in app.routes:
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", None)

        # Check if it's a standard APIRoute
        if path is not None:
            print(f"Path: {path} | Methods: {methods}")
        # If it's an IncludedRouter or Mounting object, inspect internal routes
        else:
            for sub_route in getattr(route, "routes", []):
                print(
                    f"Sub-Path: {getattr(sub_route, 'path', None)} | Methods: {getattr(sub_route, 'methods', None)}"
                )
    print("=========================")
    print("="*50 + "\n")
    yield


app = FastAPI(title="FIFA-IQ API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(teams.router, prefix="/api/v1/teams", tags=["Teams"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Predictions"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.get("/")
def root() -> dict[str, str]:
    """Health check endpoint for the FIFA-IQ backend."""
    return {"status": "ok", "message": "FIFA-IQ backend is running"}
