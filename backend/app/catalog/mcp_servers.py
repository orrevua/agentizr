from app.catalog import McpServerInfo
from app.domain.enums import Platform

_MCP_PLATFORMS = [Platform.claude_code, Platform.codex, Platform.gemini]

MCP_SERVERS: list[McpServerInfo] = [
    McpServerInfo(
        name="filesystem", description="Local filesystem access", platforms=_MCP_PLATFORMS
    ),
    McpServerInfo(
        name="github", description="GitHub repos, issues, and PRs", platforms=_MCP_PLATFORMS
    ),
    McpServerInfo(
        name="postgres", description="Read-only Postgres queries", platforms=_MCP_PLATFORMS
    ),
    McpServerInfo(
        name="brave-search", description="Web search via Brave API", platforms=_MCP_PLATFORMS
    ),
]
