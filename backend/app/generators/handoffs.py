from app.domain.agent import AgentDefinition
from app.domain.enums import OutputLanguage
from app.domain.workflow import Workflow

HEADERS: dict[OutputLanguage, dict[str, str]] = {
    OutputLanguage.en: {
        "section": "## Handoffs",
        "when": "When",
        "handoff_to": "hand off to",
        "applicable": "applicable",
    },
    OutputLanguage.pt_br: {
        "section": "## Transferências",
        "when": "Quando",
        "handoff_to": "transferir para",
        "applicable": "aplicável",
    },
}


def render_handoffs(
    agent: AgentDefinition,
    workflow: Workflow,
    agents: list[AgentDefinition],
    lang: OutputLanguage,
) -> str:
    outgoing = [e for e in workflow.edges if e.source == agent.slug]
    if not outgoing:
        return ""
    names = {a.slug: a.name for a in agents}
    t = HEADERS[lang]
    bullets = [
        f"- {t['when']} {e.condition or e.label or t['applicable']}, "
        f"{t['handoff_to']} `@{e.target}` ({names[e.target]})"
        for e in outgoing
    ]
    return "\n\n" + t["section"] + "\n" + "\n".join(bullets) + "\n"
