from app.domain.agent import AgentDefinition
from app.domain.enums import ActivationMode, OutputLanguage, Platform
from app.domain.generated import GeneratedFile
from app.domain.workflow import Workflow
from app.generators._serialize import fenced, yaml_frontmatter
from app.generators.handoffs import render_handoffs
from app.generators.registry import register

WINDSURF_TRIGGER: dict[ActivationMode, str] = {
    ActivationMode.always: "always_on",
    ActivationMode.auto: "model_decision",
    ActivationMode.on_demand: "model_decision",
    ActivationMode.manual: "manual",
}


@register(Platform.windsurf)
def generate_windsurf(
    d: AgentDefinition,
    lang: OutputLanguage,
    workflow: Workflow,
    agents: list[AgentDefinition],
) -> list[GeneratedFile]:
    fm = {"trigger": WINDSURF_TRIGGER[d.activation_mode], "description": d.description}
    final_instructions = d.instructions + render_handoffs(d, workflow, agents, lang)
    body = yaml_frontmatter(fm) + "\n" + fenced(final_instructions)
    return [
        GeneratedFile(
            path=f"windsurf/.windsurf/rules/{d.slug}.md",
            content=body,
            platform=Platform.windsurf,
            language="markdown",
        )
    ]
