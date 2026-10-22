from app.domain.enums import OutputLanguage
from app.domain.generated import GeneratedFile
from app.domain.workspace import WorkspaceDefinition

_TEMPLATES = {
    OutputLanguage.en: {
        "title": "# Agentizr Workspace",
        "agents_heading": "## Agents",
        "tools_heading": "### Tools",
        "no_tools": "_No specific tools configured._",
        "instructions_heading": "### Instructions",
    },
    OutputLanguage.pt_br: {
        "title": "# Workspace Agentizr",
        "agents_heading": "## Agentes",
        "tools_heading": "### Ferramentas",
        "no_tools": "_Nenhuma ferramenta específica configurada._",
        "instructions_heading": "### Instruções",
    },
}


def generate_agents_md(w: WorkspaceDefinition) -> list[GeneratedFile]:
    t = _TEMPLATES[w.output_language]
    sections: list[str] = [t["title"], "", t["agents_heading"], ""]
    for a in w.agents:
        tools_section = (
            "\n".join(f"- {name}" for name in a.tools) if a.tools else t["no_tools"]
        )
        sections.extend(
            [
                f"### {a.name}",
                "",
                a.description,
                "",
                t["tools_heading"],
                "",
                tools_section,
                "",
                t["instructions_heading"],
                "",
                a.instructions.rstrip(),
                "",
            ]
        )
    return [
        GeneratedFile(
            path="universal/AGENTS.md",
            content="\n".join(sections).rstrip() + "\n",
            platform="universal",
            language="markdown",
        )
    ]
