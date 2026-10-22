from app.domain.enums import Platform
from app.generators._types import SkillGeneratorFn

SKILL_GENERATORS: dict[Platform, SkillGeneratorFn] = {}


def register_skill(platform: Platform):
    def _wrap(fn: SkillGeneratorFn) -> SkillGeneratorFn:
        SKILL_GENERATORS[platform] = fn
        return fn

    return _wrap
