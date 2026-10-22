from app.domain.agent import AgentDefinition
from app.domain.enums import OutputLanguage, Platform
from app.domain.generated import GeneratedFile
from app.domain.workflow import Workflow
from app.generators._serialize import fenced, yaml_frontmatter
from app.generators.handoffs import render_handoffs
from app.generators.registry import register


@register(Platform.gemini)
def generate_gemini(
    d: AgentDefinition,
    lang: OutputLanguage,
    workflow: Workflow,
    agents: list[AgentDefinition],
) -> list[GeneratedFile]:
    fm: dict = {"name": d.name, "description": d.description}
    if d.model and d.model != "inherit":
        fm["model"] = d.model
    if d.tools:
        fm["tools"] = list(d.tools)
    if d.mcp_servers:
        fm["mcpServers"] = list(d.mcp_servers)

    final_instructions = d.instructions + render_handoffs(d, workflow, agents, lang)
    body = yaml_frontmatter(fm) + "\n" + fenced(final_instructions)
    return [
        GeneratedFile(
            path=f"gemini/.gemini/agents/{d.slug}.md",
            content=body,
            platform=Platform.gemini,
            language="markdown",
        )
    ]
