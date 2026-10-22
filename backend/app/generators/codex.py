from app.domain.agent import AgentDefinition
from app.domain.enums import OutputLanguage, Platform
from app.domain.generated import GeneratedFile
from app.domain.workflow import Workflow
from app.generators._serialize import toml_block
from app.generators.handoffs import render_handoffs
from app.generators.registry import register


@register(Platform.codex)
def generate_codex(
    d: AgentDefinition,
    lang: OutputLanguage,
    workflow: Workflow,
    agents: list[AgentDefinition],
) -> list[GeneratedFile]:
    merged_mcp: list[str] = list(dict.fromkeys([*d.tools, *d.mcp_servers]))

    final_instructions = d.instructions + render_handoffs(d, workflow, agents, lang)
    agent_fields: dict = {
        "name": d.name,
        "description": d.description,
        "developer_instructions": final_instructions,
        "model_reasoning_effort": d.reasoning_effort.value,
    }
    if merged_mcp:
        agent_fields["mcp_servers"] = merged_mcp

    codex_agents = [a for a in agents if Platform.codex in a.target_platforms]
    if not codex_agents:
        codex_agents = [d]
    config_agents: dict = {}
    for a in codex_agents:
        key = a.slug.replace("-", "_")
        config_agents[key] = {
            "description": a.description,
            "config_file": f"agents/{a.slug}.toml",
        }

    result = [
        GeneratedFile(
            path=f"codex/.codex/agents/{d.slug}.toml",
            content=toml_block(agent_fields),
            platform=Platform.codex,
            language="toml",
        ),
    ]
    if d.slug == codex_agents[0].slug:
        result.append(
            GeneratedFile(
                path="codex/.codex/config.toml",
                content=toml_block({"agents": config_agents}),
                platform=Platform.codex,
                language="toml",
            )
        )
    return result
