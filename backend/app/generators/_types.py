from typing import Callable

from app.domain.agent import AgentDefinition
from app.domain.enums import OutputLanguage
from app.domain.generated import GeneratedFile
from app.domain.skill import SkillDefinition
from app.domain.workflow import Workflow

GeneratorFn = Callable[
    [AgentDefinition, OutputLanguage, Workflow, list[AgentDefinition]],
    list[GeneratedFile],
]

SkillGeneratorFn = Callable[[SkillDefinition, OutputLanguage], list[GeneratedFile]]
