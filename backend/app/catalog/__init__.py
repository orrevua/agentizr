from typing import Any

from pydantic import BaseModel, ConfigDict

from app.domain.enums import Platform


class _CatalogBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Subtool(_CatalogBase):
    name: str
    description: str


class ToolInfo(_CatalogBase):
    name: str
    description: str
    platforms: list[Platform]
    subtools: list[Subtool] = []


class ModelInfo(_CatalogBase):
    id: str
    label: str
    platforms: list[Platform]


class McpServerInfo(_CatalogBase):
    name: str
    description: str
    platforms: list[Platform]


class PresetInfo(_CatalogBase):
    id: str
    label: str
    description: str
    definition: dict[str, Any]


__all__ = ["Subtool", "ToolInfo", "ModelInfo", "McpServerInfo", "PresetInfo"]
