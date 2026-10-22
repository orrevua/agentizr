from app.catalog import ModelInfo
from app.domain.enums import Platform

MODELS: list[ModelInfo] = [
    ModelInfo(id="inherit", label="Inherit", platforms=[Platform.claude_code]),
    ModelInfo(
        id="claude-sonnet-4-6", label="Claude Sonnet 4.6", platforms=[Platform.claude_code]
    ),
    ModelInfo(id="claude-opus-4-7", label="Claude Opus 4.7", platforms=[Platform.claude_code]),
    ModelInfo(id="gpt-4.1", label="GPT-4.1", platforms=[Platform.codex]),
    ModelInfo(id="gpt-5", label="GPT-5", platforms=[Platform.codex]),
    ModelInfo(id="gemini-2.5-pro", label="Gemini 2.5 Pro", platforms=[Platform.gemini]),
    ModelInfo(id="gemini-2.5-flash", label="Gemini 2.5 Flash", platforms=[Platform.gemini]),
]
