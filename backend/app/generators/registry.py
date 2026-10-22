from app.domain.enums import Platform
from app.domain.generated import GeneratedFile, GenerationResult
from app.domain.workspace import WorkspaceDefinition
from app.generators._types import GeneratorFn

GENERATORS: dict[Platform, GeneratorFn] = {}


def register(platform: Platform):
    def _wrap(fn: GeneratorFn) -> GeneratorFn:
        GENERATORS[platform] = fn
        return fn

    return _wrap


def generate_workspace(w: WorkspaceDefinition) -> GenerationResult:
    from app.generators.agents_md import generate_agents_md
    from app.generators.readme import generate_readme
    from app.generators.skills.registry import SKILL_GENERATORS
    from app.generators.warnings import collect_warnings
    from app.generators.workflow_json import emit_workflow_json

    files: list[GeneratedFile] = []
    for agent in w.agents:
        for platform in agent.target_platforms:
            files += GENERATORS[platform](agent, w.output_language, w.workflow, w.agents)

    for skill in w.skills:
        for platform in skill.platforms:
            gen = SKILL_GENERATORS.get(Platform(platform))
            if gen:
                files += gen(skill, w.output_language)

    files += generate_agents_md(w)
    workflow_file = emit_workflow_json(w.workflow, w.agents)
    files.append(workflow_file)
    files.append(generate_readme(w, files, workflow_file.content))
    return GenerationResult(files=files, warnings=collect_warnings(w))
