from typing import Callable

from fastapi import APIRouter

from app.catalog.handoff_conditions import HANDOFF_CONDITIONS
from app.catalog.mcp_servers import MCP_SERVERS
from app.catalog.models import MODELS
from app.catalog.presets import PRESETS
from app.catalog.tools import TOOLS

router = APIRouter(prefix="/catalog", tags=["catalog"])

CATALOG_ENDPOINTS: dict[str, tuple[str, Callable[[], dict]]] = {
    "/tools": ("tools", lambda: {"tools": TOOLS}),
    "/models": ("models", lambda: {"models": MODELS}),
    "/mcp-servers": ("servers", lambda: {"servers": MCP_SERVERS}),
    "/presets": ("presets", lambda: {"presets": PRESETS}),
    "/handoff-conditions": ("conditions", lambda: {"conditions": HANDOFF_CONDITIONS}),
}


def _bind(path: str, payload: Callable[[], dict]) -> None:
    @router.get(path, name=f"catalog{path.replace('/', '_')}")
    def _handler() -> dict:
        return payload()


for _path, (_key, _payload) in CATALOG_ENDPOINTS.items():
    _bind(_path, _payload)
