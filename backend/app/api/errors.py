from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

Handler = Callable[[Request, Exception], Awaitable[JSONResponse]]


async def _handle_validation(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    details = [
        {"field": ".".join(str(p) for p in e["loc"][1:]) or e["loc"][0], "message": e["msg"]}
        for e in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"error": "validation_failed", "details": details},
    )


ERROR_HANDLERS: dict[type[Exception], Handler] = {
    RequestValidationError: _handle_validation,
}


def register_error_handlers(app: FastAPI) -> None:
    for exc_type, handler in ERROR_HANDLERS.items():
        app.add_exception_handler(exc_type, handler)
