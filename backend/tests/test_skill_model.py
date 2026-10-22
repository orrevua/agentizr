import pytest
from pydantic import ValidationError

from app.domain.skill import SkillDefinition


def _payload(**overrides):
    base = {
        "name": "Code Searcher",
        "description": "Searches code intelligently",
        "instructions": "Use ripgrep when available.",
        "platforms": ["claude-code"],
    }
    base.update(overrides)
    return base


def test_auto_slug_from_name():
    s = SkillDefinition.model_validate(_payload())
    assert s.slug == "code-searcher"


def test_camel_case_round_trip():
    s = SkillDefinition.model_validate(_payload(scaffoldDirs=True))
    dumped = s.model_dump(by_alias=True)
    assert dumped["scaffoldDirs"] is True
    assert dumped["platforms"] == ["claude-code"]


def test_rejects_empty_platforms():
    with pytest.raises(ValidationError):
        SkillDefinition.model_validate(_payload(platforms=[]))


def test_rejects_unsupported_platform():
    with pytest.raises(ValidationError):
        SkillDefinition.model_validate(_payload(platforms=["copilot"]))


def test_explicit_slug_preserved():
    s = SkillDefinition.model_validate(_payload(slug="custom"))
    assert s.slug == "custom"


def test_auto_slug_skipped_when_name_blank():
    with pytest.raises(ValidationError):
        SkillDefinition.model_validate({**_payload(), "name": "  "})


def test_non_dict_passes_through():
    with pytest.raises(ValidationError):
        SkillDefinition.model_validate("not-a-dict")
