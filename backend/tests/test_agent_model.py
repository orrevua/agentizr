import pytest
from pydantic import ValidationError

from app.domain.agent import AgentDefinition
from app.domain.enums import Platform


def _payload(**overrides):
    base = {
        "name": "Security Reviewer",
        "description": "Scans code for vulnerabilities",
        "instructions": "You are a security expert. Always check for SQL injection.",
        "targetPlatforms": ["claude-code"],
    }
    base.update(overrides)
    return base


def test_auto_slug_from_name():
    d = AgentDefinition.model_validate(_payload())
    assert d.slug == "security-reviewer"


def test_alias_round_trip():
    d = AgentDefinition.model_validate(
        _payload(mcpServers=["filesystem"], applyToGlobs=["src/**/*.ts"], activationMode="always")
    )
    dumped = d.model_dump(by_alias=True)
    assert dumped["mcpServers"] == ["filesystem"]
    assert dumped["applyToGlobs"] == ["src/**/*.ts"]
    assert dumped["activationMode"] == "always"


def test_rejects_empty_target_platforms():
    with pytest.raises(ValidationError):
        AgentDefinition.model_validate(_payload(targetPlatforms=[]))


def test_explicit_slug_preserved():
    d = AgentDefinition.model_validate(_payload(slug="custom-slug"))
    assert d.slug == "custom-slug"


def test_platform_enum_resolves():
    assert Platform("claude-code") is Platform.claude_code


def test_rejects_output_language_field():
    import pytest as _pytest

    with _pytest.raises(ValidationError):
        AgentDefinition.model_validate(_payload(outputLanguage="en"))


def test_rejects_generation_type_field():
    import pytest as _pytest

    with _pytest.raises(ValidationError):
        AgentDefinition.model_validate(_payload(generationType="agent"))
