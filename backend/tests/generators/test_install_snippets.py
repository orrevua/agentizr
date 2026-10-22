from app.domain.enums import OutputLanguage, Platform
from app.generators.install_snippets import PLATFORM_INSTALL_SNIPPETS, render_snippets


def test_all_platforms_have_both_languages():
    for p in Platform:
        assert OutputLanguage.en in PLATFORM_INSTALL_SNIPPETS[p]
        assert OutputLanguage.pt_br in PLATFORM_INSTALL_SNIPPETS[p]


def test_render_snippets_returns_one_per_platform_in_order():
    out = render_snippets(
        [Platform.gemini, Platform.claude_code], "alpha", OutputLanguage.en
    )
    assert len(out) == 2
    assert out[0].startswith("**Claude Code**")
    assert out[1].startswith("**Gemini**")


def test_render_snippets_pt_br():
    out = render_snippets([Platform.claude_code], "alpha", OutputLanguage.pt_br)
    assert "copie" in out[0]
    assert "alpha" in out[0]
