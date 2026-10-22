from app.domain.enums import OutputLanguage, Platform

PLATFORM_INSTALL_SNIPPETS: dict[Platform, dict[OutputLanguage, str]] = {
    Platform.claude_code: {
        OutputLanguage.en: "**Claude Code** — copy `claude-code/{agent_slug}/.claude/` into your repository root.",
        OutputLanguage.pt_br: "**Claude Code** — copie `claude-code/{agent_slug}/.claude/` para a raiz do seu repositório.",
    },
    Platform.copilot: {
        OutputLanguage.en: "**GitHub Copilot** — copy `copilot/{agent_slug}/.github/` into your repository root.",
        OutputLanguage.pt_br: "**GitHub Copilot** — copie `copilot/{agent_slug}/.github/` para a raiz do seu repositório.",
    },
    Platform.codex: {
        OutputLanguage.en: "**Codex** — copy `codex/{agent_slug}/.codex/` into your repository root.",
        OutputLanguage.pt_br: "**Codex** — copie `codex/{agent_slug}/.codex/` para a raiz do seu repositório.",
    },
    Platform.gemini: {
        OutputLanguage.en: "**Gemini** — copy `gemini/{agent_slug}/.gemini/` into your repository root.",
        OutputLanguage.pt_br: "**Gemini** — copie `gemini/{agent_slug}/.gemini/` para a raiz do seu repositório.",
    },
    Platform.cursor: {
        OutputLanguage.en: "**Cursor** — copy `cursor/{agent_slug}/.cursor/` into your repository root.",
        OutputLanguage.pt_br: "**Cursor** — copie `cursor/{agent_slug}/.cursor/` para a raiz do seu repositório.",
    },
    Platform.windsurf: {
        OutputLanguage.en: "**Windsurf** — copy `windsurf/{agent_slug}/.windsurf/` into your repository root.",
        OutputLanguage.pt_br: "**Windsurf** — copie `windsurf/{agent_slug}/.windsurf/` para a raiz do seu repositório.",
    },
}

_PLATFORM_ORDER: list[Platform] = list(Platform)


def render_snippets(
    platforms: list[Platform], slug: str, lang: OutputLanguage
) -> list[str]:
    requested = set(platforms)
    return [
        PLATFORM_INSTALL_SNIPPETS[p][lang].format(agent_slug=slug)
        for p in _PLATFORM_ORDER
        if p in requested
    ]
