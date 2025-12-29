"""Serve frontend static files in production."""
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

def mount_static_files(app):
    """Mount static files for production frontend."""
    static_dir = Path(__file__).parent.parent.parent / "frontend" / "dist"
    
    if static_dir.exists():
        # Serve static assets
        app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")
        
        # Serve index.html for all other routes (SPA)
        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            # Don't intercept API routes
            if full_path.startswith("api/"):
                return None
            
            index_file = static_dir / "index.html"
            if index_file.exists():
                return FileResponse(index_file)
            return None
