from enum import StrEnum


class Platform(StrEnum):
    claude_code = "claude-code"
    copilot = "copilot"
    codex = "codex"
    gemini = "gemini"
    cursor = "cursor"
    windsurf = "windsurf"


class ActivationMode(StrEnum):
    always = "always"
    auto = "auto"
    on_demand = "on_demand"
    manual = "manual"


class Scope(StrEnum):
    project = "project"
    global_ = "global"


class Memory(StrEnum):
    project = "project"
    user = "user"
    local = "local"
    none = "none"


class ReasoningEffort(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class OutputLanguage(StrEnum):
    en = "en"
    pt_br = "pt-br"


class GenerationType(StrEnum):
    agent = "agent"
    rule = "rule"
    skill = "skill"
    root_context = "root-context"
