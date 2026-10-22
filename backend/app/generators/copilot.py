from app.domain.agent import AgentDefinition
from app.domain.enums import OutputLanguage, Platform
from app.domain.generated import GeneratedFile
from app.domain.workflow import Workflow
from app.generators._serialize import fenced, yaml_frontmatter
from app.generators.handoffs import render_handoffs
from app.generators.registry import register


@register(Platform.copilot)
def generate_copilot(
    d: AgentDefinition,
    lang: OutputLanguage,
    workflow: Workflow,
    agents: list[AgentDefinition],
) -> list[GeneratedFile]:
    fm: dict = {"name": d.name, "description": d.description}
    if d.apply_to_globs:
        fm["applyTo"] = ", ".join(d.apply_to_globs)
    if d.tools:
        fm["tools"] = list(d.tools)

    final_instructions = d.instructions + render_handoffs(d, workflow, agents, lang)
    body = yaml_frontmatter(fm) + "\n" + fenced(final_instructions)
    return [
        GeneratedFile(
            path=f"copilot/.github/agents/{d.slug}.agent.md",
            content=body,
            platform=Platform.copilot,
            language="markdown",
        )
    ]
