import pytest

from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow
from app.generators.agents_md import generate_agents_md
from app.generators.codex import generate_codex
from app.generators.copilot import generate_copilot
from app.generators.cursor import generate_cursor
from app.generators.gemini import generate_gemini
from app.generators.registry import generate_workspace
from app.generators.warnings import collect_warnings
from app.generators.windsurf import generate_windsurf
from tests.factories import make_agent, make_workspace


def _ctx():
    return OutputLanguage.en, Workflow()


def test_agents_md_empty_tools_en():
    f = generate_agents_md(make_workspace(tools=[]))[0]
    assert "_No specific tools configured._" in f.content


def test_agents_md_empty_tools_pt_br():
    f = generate_agents_md(make_workspace(tools=[], output_language="pt-br"))[0]
    assert "_Nenhuma ferramenta específica configurada._" in f.content


def test_agents_md_long_instructions():
    long_text = "x" * 49_999
    f = generate_agents_md(make_workspace(instructions=long_text))[0]
    assert "x" * 100 in f.content


@pytest.mark.parametrize("mode", ["always", "auto", "on_demand", "manual"])
def test_cursor_all_activation_modes(mode):
    d = make_agent(activationMode=mode)
    lang, wf = _ctx()
    f = generate_cursor(d, lang, wf, [d])[0]
    assert f.path.endswith(".mdc")


@pytest.mark.parametrize("mode", ["always", "auto", "on_demand", "manual"])
def test_windsurf_all_activation_modes(mode):
    d = make_agent(activationMode=mode)
    lang, wf = _ctx()
    files = generate_windsurf(d, lang, wf, [d])
    assert len(files) == 1


def test_codex_no_tools_no_mcp_omits_field():
    d = make_agent(tools=[], mcpServers=[])
    lang, wf = _ctx()
    files = generate_codex(d, lang, wf, [d])
    agent_file = next(f for f in files if f.path.endswith("/security-reviewer.toml"))
    assert "mcp_servers" not in agent_file.content


def test_copilot_with_tools_and_globs():
    d = make_agent(tools=["grep"], applyToGlobs=["src/**/*.ts"])
    lang, wf = _ctx()
    f = generate_copilot(d, lang, wf, [d])[0]
    assert "- grep" in f.content
    assert "applyTo: src/**/*.ts" in f.content


def test_gemini_with_mcp_only():
    d = make_agent(mcpServers=["filesystem"])
    lang, wf = _ctx()
    f = generate_gemini(d, lang, wf, [d])[0]
    assert "mcpServers:" in f.content


def test_warnings_silent_for_default():
    assert collect_warnings(make_workspace()) == []


def test_cursor_always_word_limit_silent_under_threshold():
    w = make_workspace(
        targetPlatforms=["cursor"], activationMode="always", instructions="short text"
    )
    codes = {wn.code for wn in collect_warnings(w)}
    assert "cursor_always_word_limit" not in codes


def test_global_scope_path_differences_via_warnings():
    project = collect_warnings(make_workspace(scope="project"))
    global_ = collect_warnings(make_workspace(scope="global"))
    assert {w.code for w in project} == set()
    assert "global_scope_untracked" in {w.code for w in global_}


def test_output_language_round_trip_through_generate_workspace():
    result = generate_workspace(make_workspace(output_language="pt-br"))
    readme = next(f for f in result.files if f.path == "README.md")
    agents_md = next(f for f in result.files if f.path == "universal/AGENTS.md")
    assert "# Workspace Agentizr" in readme.content
    assert "### Instruções" in agents_md.content
