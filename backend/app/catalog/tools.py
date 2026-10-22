from app.catalog import Subtool, ToolInfo
from app.domain.enums import Platform

CC = Platform.claude_code
CP = Platform.copilot
GM = Platform.gemini

TOOLS: list[ToolInfo] = [
    ToolInfo(
        name="Read",
        description="Read file contents from disk",
        platforms=[CC, CP, GM],
        subtools=[
            Subtool(name="file", description="Read a regular file"),
            Subtool(name="notebook", description="Read a Jupyter notebook with outputs"),
            Subtool(name="image", description="Read an image file as visual input"),
        ],
    ),
    ToolInfo(
        name="Write",
        description="Create or overwrite files",
        platforms=[CC],
    ),
    ToolInfo(
        name="Edit",
        description="Apply targeted edits to existing files",
        platforms=[CC],
        subtools=[
            Subtool(name="replaceString", description="Replace one exact string with another"),
            Subtool(name="multiEdit", description="Batch multiple edits in a single call"),
            Subtool(name="createFile", description="Create a new file at a given path"),
        ],
    ),
    ToolInfo(
        name="Bash",
        description="Execute shell commands",
        platforms=[CC, CP, GM],
        subtools=[
            Subtool(name="run", description="Run a command synchronously and capture output"),
            Subtool(name="background", description="Run a long-lived command in the background"),
            Subtool(name="output", description="Stream output from a background shell"),
            Subtool(name="kill", description="Terminate a background shell"),
        ],
    ),
    ToolInfo(name="Glob", description="Find files by name pattern", platforms=[CC]),
    ToolInfo(name="Grep", description="Search file contents with regex", platforms=[CC, CP, GM]),
    ToolInfo(name="WebFetch", description="Fetch and parse a URL", platforms=[CC, CP, GM]),
    ToolInfo(name="WebSearch", description="Run web search queries", platforms=[CC]),
    ToolInfo(name="Task", description="Spawn a subagent for a focused task", platforms=[CC]),
    ToolInfo(name="TodoWrite", description="Manage a structured todo list", platforms=[CC]),
    ToolInfo(name="NotebookEdit", description="Edit Jupyter notebook cells", platforms=[CC]),
]
