from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import predictions, teams


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
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(teams.router, prefix="/api/v1/teams", tags=["Teams"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Predictions"])


@app.get("/")
def root() -> dict[str, str]:
    """Health check endpoint for the FIFA-IQ backend."""
    return {"status": "ok", "message": "FIFA-IQ backend is running"}
