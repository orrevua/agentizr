from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import catalog, generate, health, preview
from app.api.errors import register_error_handlers
from app.settings import settings

app = FastAPI(title="Agentizr API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

for router in (catalog.router, generate.router, health.router, preview.router):
    app.include_router(router, prefix=settings.api_prefix)
