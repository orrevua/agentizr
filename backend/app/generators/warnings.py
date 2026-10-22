from typing import Callable

from app.domain.agent import AgentDefinition
from app.domain.enums import ActivationMode, Platform, Scope
from app.domain.generated import Warning
from app.domain.workspace import WorkspaceDefinition

WarningRule = tuple[Callable[[AgentDefinition], bool], str, str, Platform | None]


def _copilot_over_limit(d: AgentDefinition) -> bool:
    return Platform.copilot in d.target_platforms and len(d.instructions) > 6_000


def _cursor_always_too_long(d: AgentDefinition) -> bool:
    if Platform.cursor not in d.target_platforms:
        return False
    if d.activation_mode is not ActivationMode.always:
        return False
    return len(d.instructions.split()) > 200


def _codex_tools_present(d: AgentDefinition) -> bool:
    return Platform.codex in d.target_platforms and len(d.tools) > 0


def _global_scope(d: AgentDefinition) -> bool:
    return d.scope is Scope.global_


RULES: list[WarningRule] = [
    (
        _copilot_over_limit,
        "copilot_char_limit",
        "Copilot has a 6,000-character limit per instruction file. Your instructions will be truncated.",
        Platform.copilot,
    ),
    (
        _cursor_always_too_long,
        "cursor_always_word_limit",
        "Cursor recommends ≤ 200 words for always-apply rules to save context tokens.",
        Platform.cursor,
    ),
    (
        _codex_tools_present,
        "codex_tools_as_mcp",
        "Codex maps tools to `mcp_servers`. Ensure these MCP servers are configured in your Codex environment.",
        Platform.codex,
    ),
    (
        _global_scope,
        "global_scope_untracked",
        "Global agents are installed to your home directory. They won't be tracked in version control.",
        None,
    ),
]


def collect_warnings(w: WorkspaceDefinition) -> list[Warning]:
    prefix = len(w.agents) > 1
    out: list[Warning] = []
    for agent in w.agents:
        for predicate, code, msg, plat in RULES:
            if predicate(agent):
                message = f"[{agent.name}] {msg}" if prefix else msg
                out.append(Warning(code=code, message=message, platform=plat))
    return out
