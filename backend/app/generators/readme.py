from datetime import date

from app.domain.enums import OutputLanguage
from app.domain.generated import GeneratedFile
from app.domain.workspace import WorkspaceDefinition
from app.generators.install_snippets import render_snippets
from app.generators.mermaid import has_cycle, render_mermaid

_T = {
    OutputLanguage.en: {
        "title": "# Agentizr Workspace",
        "summary": "Generated {date} · {n} agent(s) · {m} skill(s) · {e} handoff edge(s)",
        "workflow_h": "## Workflow",
        "cycle_note": "> **Note:** This workflow contains cycles. Make sure each loop has a clear exit.",
        "agents_h": "## Agents",
        "install_h": "**Install per platform:**",
        "handoffs_h": "**Outgoing handoffs:**",
        "no_handoffs": "none",
        "skills_h": "## Skills",
        "skills_install": {
            "claude-code": "**Claude Code** — copy `claude-code/skills/{slug}/` into `.claude/skills/`.",
            "gemini": "**Gemini** — copy `gemini/skills/{slug}/` into `.gemini/skills/`.",
        },
        "workflow_json_h": "## workflow.json",
        "universal_h": "## Universal Fallback",
        "universal_body": "See `universal/AGENTS.md`.",
    },
    OutputLanguage.pt_br: {
        "title": "# Workspace Agentizr",
        "summary": "Gerado em {date} · {n} agente(s) · {m} skill(s) · {e} transferência(s)",
        "workflow_h": "## Fluxo de trabalho",
        "cycle_note": "> **Nota:** Este fluxo contém ciclos. Garanta uma saída clara em cada loop.",
        "agents_h": "## Agentes",
        "install_h": "**Instalação por plataforma:**",
        "handoffs_h": "**Transferências de saída:**",
        "no_handoffs": "nenhuma",
        "skills_h": "## Skills",
        "skills_install": {
            "claude-code": "**Claude Code** — copie `claude-code/skills/{slug}/` para `.claude/skills/`.",
            "gemini": "**Gemini** — copie `gemini/skills/{slug}/` para `.gemini/skills/`.",
        },
        "workflow_json_h": "## workflow.json",
        "universal_h": "## Fallback universal",
        "universal_body": "Veja `universal/AGENTS.md`.",
    },
}


def _excerpt(content: str, max_lines: int = 80) -> str:
    lines = content.splitlines()
    if len(lines) <= max_lines:
        return content
    return "\n".join(lines[:max_lines]) + "\n"


def _handoff_bullets(slug: str, w: WorkspaceDefinition) -> list[str]:
    names = {a.slug: a.name for a in w.agents}
    return [
        f"- `@{e.target}` ({names[e.target]}) — {e.condition or e.label or '-'}"
        for e in w.workflow.edges
        if e.source == slug
    ]


def generate_readme(
    w: WorkspaceDefinition,
    files: list[GeneratedFile],
    workflow_json_content: str,
) -> GeneratedFile:
    t = _T[w.output_language]
    parts: list[str] = [
        t["title"],
        "",
        t["summary"].format(
            date=date.today().isoformat(),
            n=len(w.agents),
            m=len(w.skills),
            e=len(w.workflow.edges),
        ),
        "",
        t["workflow_h"],
        "",
        "```mermaid",
        render_mermaid(w.workflow, w.agents).rstrip(),
        "```",
        "",
    ]
    if has_cycle(w.workflow):
        parts += [t["cycle_note"], ""]

    parts += [t["agents_h"], ""]
    for a in w.agents:
        parts += [
            f"### {a.name} (`@{a.slug}`)",
            "",
            a.description,
            "",
            t["install_h"],
            "",
        ]
        parts += [f"- {line}" for line in render_snippets(a.target_platforms, a.slug, w.output_language)]
        parts += ["", t["handoffs_h"], ""]
        bullets = _handoff_bullets(a.slug, w)
        parts += bullets if bullets else [t["no_handoffs"]]
        parts.append("")

    if w.skills:
        parts += [t["skills_h"], ""]
        for s in w.skills:
            parts += [
                f"### {s.name} (`{s.slug}`)",
                "",
                s.description,
                "",
                t["install_h"],
                "",
            ]
            parts += [
                f"- {t['skills_install'][p].format(slug=s.slug)}" for p in s.platforms
            ]
            parts.append("")

    parts += [
        t["workflow_json_h"],
        "",
        "```json",
        _excerpt(workflow_json_content).rstrip(),
        "```",
        "",
        t["universal_h"],
        "",
        t["universal_body"],
        "",
    ]

    content = "\n".join(parts).rstrip() + "\n"
    _ = files
    return GeneratedFile(
        path="README.md",
        content=content,
        platform="universal",
        language="markdown",
    )
