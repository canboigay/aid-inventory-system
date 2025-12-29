"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, items, quick_entry, kit_assembly

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Humanitarian Aid Inventory and Distribution Tracking System"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(items.router, prefix=f"{settings.API_PREFIX}/items", tags=["Items"])
app.include_router(kit_assembly.router, prefix=f"{settings.API_PREFIX}/kits", tags=["Kit Assembly"])
app.include_router(quick_entry.router, prefix=f"{settings.API_PREFIX}/quick", tags=["Quick Entry"])

# Serve frontend static files in production
from app.static_files import mount_static_files
mount_static_files(app)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
