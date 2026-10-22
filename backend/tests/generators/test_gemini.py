from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow
from app.generators.gemini import generate_gemini
from tests.factories import make_agent


def _call(d):
    return generate_gemini(d, OutputLanguage.en, Workflow(), [d])


def test_path():
    f = _call(make_agent())[0]
    assert f.path == "gemini/.gemini/agents/security-reviewer.md"


def test_omits_tools_when_empty():
    f = _call(make_agent())[0]
    assert "tools:" not in f.content


def test_mcpservers_camelcase():
    f = _call(make_agent(mcpServers=["filesystem"]))[0]
    assert "mcpServers:" in f.content
    assert "- filesystem" in f.content


def test_omits_model_when_inherit():
    f = _call(make_agent(model="inherit"))[0]
    assert "model:" not in f.content


def test_includes_explicit_model():
    f = _call(make_agent(model="gemini-2.5-pro"))[0]
    assert "model: gemini-2.5-pro" in f.content


def test_two_agents_produce_sibling_folders():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    fa = generate_gemini(a, OutputLanguage.en, Workflow(), [a, b])[0]
    fb = generate_gemini(b, OutputLanguage.en, Workflow(), [a, b])[0]
    assert fa.path == "gemini/.gemini/agents/alpha.md"
    assert fb.path == "gemini/.gemini/agents/beta.md"
