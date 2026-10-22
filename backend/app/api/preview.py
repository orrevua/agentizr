from fastapi import APIRouter

from app.domain.generated import GenerationResult
from app.domain.workspace import WorkspaceDefinition
from app.generators.registry import generate_workspace

router = APIRouter(tags=["generate"])


@router.post("/preview", response_model=GenerationResult)
def preview(workspace: WorkspaceDefinition) -> GenerationResult:
    return generate_workspace(workspace)
