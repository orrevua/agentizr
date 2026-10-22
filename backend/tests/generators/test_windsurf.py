import pytest

from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow
from app.generators.windsurf import generate_windsurf
from tests.factories import make_agent


def _call(d):
    return generate_windsurf(d, OutputLanguage.en, Workflow(), [d])


def test_path():
    f = _call(make_agent())[0]
    assert f.path == "windsurf/.windsurf/rules/security-reviewer.md"


@pytest.mark.parametrize(
    "mode,trigger",
    [
        ("always", "always_on"),
        ("auto", "model_decision"),
        ("on_demand", "model_decision"),
        ("manual", "manual"),
    ],
)
def test_trigger_mapping(mode, trigger):
    f = _call(make_agent(activationMode=mode))[0]
    assert f"trigger: {trigger}" in f.content


def test_two_agents_produce_sibling_folders():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    fa = generate_windsurf(a, OutputLanguage.en, Workflow(), [a, b])[0]
    fb = generate_windsurf(b, OutputLanguage.en, Workflow(), [a, b])[0]
    assert fa.path == "windsurf/.windsurf/rules/alpha.md"
    assert fb.path == "windsurf/.windsurf/rules/beta.md"
