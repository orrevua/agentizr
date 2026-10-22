from app.domain.enums import OutputLanguage, Platform
from app.domain.generated import GeneratedFile
from app.domain.skill import SkillDefinition
from app.generators._serialize import fenced, yaml_frontmatter
from app.generators.skills.registry import register_skill


@register_skill(Platform.gemini)
def generate_gemini_skill(
    s: SkillDefinition, lang: OutputLanguage
) -> list[GeneratedFile]:
    fm = {"name": s.name, "description": s.description}
    body = yaml_frontmatter(fm) + "\n" + fenced(s.instructions)
    base = f"gemini/skills/{s.slug}"
    files = [
        GeneratedFile(
            path=f"{base}/SKILL.md",
            content=body,
            platform=Platform.gemini,
            language="markdown",
        )
    ]
    if s.scaffold_dirs:
        files += [
            GeneratedFile(
                path=f"{base}/scripts/.gitkeep",
                content="",
                platform=Platform.gemini,
                language="text",
            ),
            GeneratedFile(
                path=f"{base}/docs/.gitkeep",
                content="",
                platform=Platform.gemini,
                language="text",
            ),
        ]
    return files
