from collections.abc import Callable
from typing import Any

from app.domain.agent import AgentDefinition
from app.domain.enums import ActivationMode, OutputLanguage, Platform
from app.domain.generated import GeneratedFile
from app.domain.workflow import Workflow
from app.generators._serialize import fenced, yaml_frontmatter
from app.generators.handoffs import render_handoffs
from app.generators.registry import register

CURSOR_ACTIVATION: dict[ActivationMode, Callable[[AgentDefinition], dict[str, Any]]] = {
    ActivationMode.always: lambda d: {
        "description": d.description,
        "alwaysApply": True,
    },
    ActivationMode.auto: lambda d: {
        "description": d.description,
        "globs": list(d.apply_to_globs),
        "alwaysApply": False,
    },
    ActivationMode.on_demand: lambda d: {
        "description": d.description,
        "alwaysApply": False,
    },
    ActivationMode.manual: lambda d: {
        "description": d.description,
        "alwaysApply": False,
    },
}


@register(Platform.cursor)
def generate_cursor(
    d: AgentDefinition,
    lang: OutputLanguage,
    workflow: Workflow,
    agents: list[AgentDefinition],
) -> list[GeneratedFile]:
    fm = CURSOR_ACTIVATION[d.activation_mode](d)
    final_instructions = d.instructions + render_handoffs(d, workflow, agents, lang)
    body = yaml_frontmatter(fm) + "\n" + fenced(final_instructions)
    return [
        GeneratedFile(
            path=f"cursor/.cursor/rules/{d.slug}.mdc",
            content=body,
            platform=Platform.cursor,
            language="markdown",
        )
    ]
