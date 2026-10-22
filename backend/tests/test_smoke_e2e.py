import io
import zipfile


def _preset_payload():
    return {
        "agents": [
            {
                "name": "Security Reviewer",
                "description": "Scans code for vulnerabilities",
                "instructions": (
                    "You are a security auditor.\n"
                    "Scan for OWASP Top 10 vulnerabilities.\n"
                    "Never apply fixes — only report findings with severity."
                ),
                "tools": ["Read", "Grep", "Bash"],
                "mcpServers": ["filesystem"],
                "applyToGlobs": ["src/auth/**/*.ts"],
                "activationMode": "auto",
                "targetPlatforms": [
                    "claude-code",
                    "copilot",
                    "codex",
                    "gemini",
                    "cursor",
                    "windsurf",
                ],
            }
        ]
    }


_EXPECTED_PATHS = {
    "claude-code/.claude/agents/security-reviewer.md",
    "copilot/.github/agents/security-reviewer.agent.md",
    "codex/.codex/agents/security-reviewer.toml",
    "codex/.codex/config.toml",
    "gemini/.gemini/agents/security-reviewer.md",
    "cursor/.cursor/rules/security-reviewer.mdc",
    "windsurf/.windsurf/rules/security-reviewer.md",
    "universal/AGENTS.md",
    "README.md",
    "workflow.json",
}


def test_preview_and_generate_share_paths(client, tmp_path):
    preview = client.post("/api/v1/preview", json=_preset_payload())
    assert preview.status_code == 200
    preview_paths = {f["path"] for f in preview.json()["files"]}
    assert preview_paths >= _EXPECTED_PATHS

    download = client.post("/api/v1/generate", json=_preset_payload())
    assert download.status_code == 200
    with zipfile.ZipFile(io.BytesIO(download.content)) as zf:
        zip_paths = set(zf.namelist())
        zf.extractall(tmp_path)
    assert zip_paths >= _EXPECTED_PATHS

    for p in _EXPECTED_PATHS:
        assert (tmp_path / p).exists()
