"""Dump the FastAPI OpenAPI schema for frontend contract testing."""

import json
import sys
from pathlib import Path

from app.main import app


def main(out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(app.openapi(), indent=2), encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    default = Path(__file__).resolve().parents[2] / "frontend" / "src" / "test" / "fixtures" / "openapi.json"
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else default
    main(target)
