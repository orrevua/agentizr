from app.domain.enums import OutputLanguage, Platform
from app.generators.skills.claude_code import generate_claude_skill
from app.generators.skills.registry import SKILL_GENERATORS
from tests.factories import make_skill


def test_registered():
    assert SKILL_GENERATORS[Platform.claude_code] is generate_claude_skill


def test_emits_skill_md_with_frontmatter():
    files = generate_claude_skill(make_skill(), OutputLanguage.en)
    assert len(files) == 1
    f = files[0]
    assert f.path == "claude-code/skills/code-searcher/SKILL.md"
    assert "name: Code Searcher" in f.content
    assert "description: Searches code intelligently" in f.content
    assert "Use ripgrep" in f.content


def test_scaffold_dirs_adds_gitkeeps():
    files = generate_claude_skill(make_skill(scaffoldDirs=True), OutputLanguage.en)
    paths = {f.path for f in files}
    assert "claude-code/skills/code-searcher/scripts/.gitkeep" in paths
    assert "claude-code/skills/code-searcher/docs/.gitkeep" in paths


def test_scaffold_dirs_default_false():
    files = generate_claude_skill(make_skill(), OutputLanguage.en)
    assert len(files) == 1
