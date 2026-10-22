from app.domain.agent import AgentDefinition
from app.domain.workflow import Workflow


def _node_id(slug: str) -> str:
    return slug.replace("-", "_")


def has_cycle(workflow: Workflow) -> bool:
    adj: dict[str, list[str]] = {}
    for e in workflow.edges:
        adj.setdefault(e.source, []).append(e.target)
    WHITE, GRAY, BLACK = 0, 1, 2
    color: dict[str, int] = {}

    def visit(node: str) -> bool:
        color[node] = GRAY
        for nxt in adj.get(node, []):
            state = color.get(nxt, WHITE)
            if state == GRAY:
                return True
            if state == WHITE and visit(nxt):
                return True
        color[node] = BLACK
        return False

    return any(color.get(src, WHITE) == WHITE and visit(src) for src in adj)


def render_mermaid(workflow: Workflow, agents: list[AgentDefinition]) -> str:
    lines: list[str] = []
    if has_cycle(workflow):
        lines.append("%% Contains cycles")
    lines.append("flowchart LR")
    for a in agents:
        lines.append(f'  {_node_id(a.slug)}["{a.name}"]')
    for e in workflow.edges:
        label = e.condition or e.label
        arrow = f"-->|{label}|" if label else "-->"
        lines.append(f"  {_node_id(e.source)} {arrow} {_node_id(e.target)}")
    return "\n".join(lines) + "\n"
