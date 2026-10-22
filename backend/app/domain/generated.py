from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.domain.enums import Platform

PlatformOrUniversal = Platform | Literal["universal"]
FileLanguage = Literal["markdown", "toml", "yaml", "text"]


class GeneratedFile(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    path: str
    content: str
    platform: PlatformOrUniversal
    language: FileLanguage


class Warning(BaseModel):
    code: str
    message: str
    platform: Platform | None = None


class GenerationResult(BaseModel):
    files: list[GeneratedFile]
    warnings: list[Warning] = []
