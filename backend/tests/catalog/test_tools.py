from app.catalog.tools import TOOLS
from app.domain.enums import Platform


def test_eleven_tools():
    assert len(TOOLS) == 11


def test_every_tool_lists_claude_code():
    for t in TOOLS:
        assert Platform.claude_code in t.platforms


def test_no_duplicate_names():
    names = [t.name for t in TOOLS]
    assert len(names) == len(set(names))
