from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.domain.workspace import WorkspaceDefinition
from app.generators.registry import generate_workspace
from app.zip import stream_zip

router = APIRouter(tags=["generate"])


@router.post("/generate")
def generate(workspace: WorkspaceDefinition) -> StreamingResponse:
    result = generate_workspace(workspace)
    filename = (
        f"agentizr-{workspace.agents[0].slug}.zip"
        if len(workspace.agents) == 1
        else "agentizr-workspace.zip"
    )
    return StreamingResponse(
        stream_zip(result.files),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
