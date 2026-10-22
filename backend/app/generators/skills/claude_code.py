from app.domain.enums import OutputLanguage, Platform
from app.domain.generated import GeneratedFile
from app.domain.skill import SkillDefinition
from app.generators._serialize import fenced, yaml_frontmatter
from app.generators.skills.registry import register_skill


@register_skill(Platform.claude_code)
def generate_claude_skill(
    s: SkillDefinition, lang: OutputLanguage
) -> list[GeneratedFile]:
    fm = {"name": s.name, "description": s.description}
    body = yaml_frontmatter(fm) + "\n" + fenced(s.instructions)
    base = f"claude-code/skills/{s.slug}"
    files = [
        GeneratedFile(
            path=f"{base}/SKILL.md",
            content=body,
            platform=Platform.claude_code,
            language="markdown",
        )
    ]
    if s.scaffold_dirs:
        files += [
            GeneratedFile(
                path=f"{base}/scripts/.gitkeep",
                content="",
                platform=Platform.claude_code,
                language="text",
            ),
            GeneratedFile(
                path=f"{base}/docs/.gitkeep",
                content="",
                platform=Platform.claude_code,
                language="text",
            ),
        ]
    return files
