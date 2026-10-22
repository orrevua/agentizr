from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow
from app.generators.copilot import generate_copilot
from tests.factories import make_agent


def _call(d):
    return generate_copilot(d, OutputLanguage.en, Workflow(), [d])


def test_extension_and_path():
    f = _call(make_agent())[0]
    assert f.path == "copilot/.github/agents/security-reviewer.agent.md"


def test_tools_as_yaml_array():
    f = _call(make_agent(tools=["grep", "read_file"]))[0]
    assert "tools:" in f.content
    assert "- grep" in f.content
    assert "- read_file" in f.content


def test_apply_to_joined_string():
    f = _call(make_agent(applyToGlobs=["src/auth/**/*.ts", "src/crypto/**/*.ts"]))[0]
    assert "applyTo: src/auth/**/*.ts, src/crypto/**/*.ts" in f.content


def test_omits_apply_to_when_empty():
    f = _call(make_agent())[0]
    assert "applyTo:" not in f.content


def test_two_agents_produce_sibling_folders():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    fa = generate_copilot(a, OutputLanguage.en, Workflow(), [a, b])[0]
    fb = generate_copilot(b, OutputLanguage.en, Workflow(), [a, b])[0]
    assert fa.path == "copilot/.github/agents/alpha.agent.md"
    assert fb.path == "copilot/.github/agents/beta.agent.md"
