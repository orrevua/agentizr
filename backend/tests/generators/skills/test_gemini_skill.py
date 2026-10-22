from app.domain.enums import OutputLanguage, Platform
from app.generators.skills.gemini import generate_gemini_skill
from app.generators.skills.registry import SKILL_GENERATORS
from tests.factories import make_skill


def test_registered():
    assert SKILL_GENERATORS[Platform.gemini] is generate_gemini_skill


def test_emits_skill_md():
    files = generate_gemini_skill(
        make_skill(platforms=["gemini"]), OutputLanguage.en
    )
    assert len(files) == 1
    f = files[0]
    assert f.path == "gemini/skills/code-searcher/SKILL.md"
    assert "name: Code Searcher" in f.content


def test_scaffold_dirs_adds_gitkeeps():
    files = generate_gemini_skill(
        make_skill(platforms=["gemini"], scaffoldDirs=True), OutputLanguage.en
    )
    paths = {f.path for f in files}
    assert "gemini/skills/code-searcher/scripts/.gitkeep" in paths
    assert "gemini/skills/code-searcher/docs/.gitkeep" in paths


def test_no_entry_for_other_platforms():
    assert Platform.copilot not in SKILL_GENERATORS
    assert Platform.codex not in SKILL_GENERATORS
    assert Platform.cursor not in SKILL_GENERATORS
    assert Platform.windsurf not in SKILL_GENERATORS
