from ruamel.yaml.scalarstring import DoubleQuotedScalarString

from app.domain.agent import AgentDefinition
from app.domain.enums import Memory, OutputLanguage, Platform
from app.domain.generated import GeneratedFile
from app.domain.workflow import Workflow
from app.generators._serialize import fenced, yaml_frontmatter
from app.generators.handoffs import render_handoffs
from app.generators.registry import register


@register(Platform.claude_code)
def generate_claude_code(
    d: AgentDefinition,
    lang: OutputLanguage,
    workflow: Workflow,
    agents: list[AgentDefinition],
) -> list[GeneratedFile]:
    fm: dict = {"name": d.name, "description": d.description}
    if d.tools:
        fm["tools"] = DoubleQuotedScalarString(", ".join(d.tools))
    fm["model"] = d.model or "inherit"
    if d.memory is not Memory.none:
        fm["memory"] = d.memory.value

    final_instructions = d.instructions + render_handoffs(d, workflow, agents, lang)
    body = yaml_frontmatter(fm) + "\n" + fenced(final_instructions)
    return [
        GeneratedFile(
            path=f"claude-code/.claude/agents/{d.slug}.md",
            content=body,
            platform=Platform.claude_code,
            language="markdown",
        )
    ]
