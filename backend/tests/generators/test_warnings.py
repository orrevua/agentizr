from app.generators.warnings import collect_warnings
from tests.factories import make_agent, make_workspace


def test_copilot_char_limit_fires_over_6000():
    w = make_workspace(targetPlatforms=["copilot"], instructions="x" * 6_001)
    codes = {wn.code for wn in collect_warnings(w)}
    assert "copilot_char_limit" in codes


def test_copilot_char_limit_silent_under_limit():
    w = make_workspace(targetPlatforms=["copilot"], instructions="x" * 500)
    codes = {wn.code for wn in collect_warnings(w)}
    assert "copilot_char_limit" not in codes


def test_cursor_always_word_limit_fires():
    long_text = " ".join(["word"] * 250)
    w = make_workspace(
        targetPlatforms=["cursor"], activationMode="always", instructions=long_text
    )
    codes = {wn.code for wn in collect_warnings(w)}
    assert "cursor_always_word_limit" in codes


def test_codex_tools_warning():
    w = make_workspace(targetPlatforms=["codex"], tools=["Read"])
    codes = {wn.code for wn in collect_warnings(w)}
    assert "codex_tools_as_mcp" in codes


def test_global_scope_warning():
    w = make_workspace(scope="global")
    codes = {wn.code for wn in collect_warnings(w)}
    assert "global_scope_untracked" in codes


def test_no_warnings_for_clean_default():
    assert collect_warnings(make_workspace()) == []


def test_multi_agent_prefixes_warning_with_name():
    a = make_agent(name="Alpha", slug="alpha", scope="global")
    b = make_agent(name="Beta", slug="beta")
    w = make_workspace(agents=[a, b])
    warnings = collect_warnings(w)
    assert any("[Alpha]" in wn.message for wn in warnings)
