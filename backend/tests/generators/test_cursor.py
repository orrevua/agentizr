import pytest

from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow
from app.generators.cursor import generate_cursor
from tests.factories import make_agent


def _call(d):
    return generate_cursor(d, OutputLanguage.en, Workflow(), [d])


def test_path():
    f = _call(make_agent())[0]
    assert f.path == "cursor/.cursor/rules/security-reviewer.mdc"


def test_always_apply_true():
    f = _call(make_agent(activationMode="always"))[0]
    assert "alwaysApply: true" in f.content
    assert "globs:" not in f.content


def test_auto_with_globs():
    f = _call(make_agent(activationMode="auto", applyToGlobs=["src/**/*.ts"]))[0]
    assert "alwaysApply: false" in f.content
    assert "- src/**/*.ts" in f.content


@pytest.mark.parametrize("mode", ["on_demand", "manual"])
def test_on_demand_and_manual_no_globs(mode):
    f = _call(make_agent(activationMode=mode, applyToGlobs=["x"]))[0]
    assert "alwaysApply: false" in f.content
    assert "globs:" not in f.content


def test_two_agents_produce_sibling_folders():
    a = make_agent(name="Alpha", slug="alpha")
    b = make_agent(name="Beta", slug="beta")
    fa = generate_cursor(a, OutputLanguage.en, Workflow(), [a, b])[0]
    fb = generate_cursor(b, OutputLanguage.en, Workflow(), [a, b])[0]
    assert fa.path == "cursor/.cursor/rules/alpha.mdc"
    assert fb.path == "cursor/.cursor/rules/beta.mdc"
