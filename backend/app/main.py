"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import auth, items, quick_entry, kit_assembly, reports, recipients

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

# Auto-run Alembic migrations on startup (idempotent)
from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command
import os

@app.on_event("startup")
def run_migrations() -> None:
    try:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        alembic_ini = os.path.join(base_dir, "alembic.ini")
        cfg = AlembicConfig(alembic_ini)
        # Override DB URL from settings
        cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
        alembic_command.upgrade(cfg, "head")
    except Exception:
        # Avoid blocking app startup; errors will surface on API use
        pass

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["Authentication"])
app.include_router(items.router, prefix=f"{settings.API_PREFIX}/items", tags=["Items"])
app.include_router(kit_assembly.router, prefix=f"{settings.API_PREFIX}/kits", tags=["Kit Assembly"])
app.include_router(quick_entry.router, prefix=f"{settings.API_PREFIX}/quick", tags=["Quick Entry"])
app.include_router(reports.router, prefix=f"{settings.API_PREFIX}/reports", tags=["Reports"])
app.include_router(recipients.router, prefix=f"{settings.API_PREFIX}/recipients", tags=["Recipients"])

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
