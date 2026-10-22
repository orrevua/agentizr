import io
from typing import Any

import tomli_w
from ruamel.yaml import YAML

_yaml = YAML()
_yaml.default_flow_style = False
_yaml.allow_unicode = True


def yaml_frontmatter(fields: dict[str, Any]) -> str:
    buf = io.StringIO()
    _yaml.dump(fields, buf)
    return f"---\n{buf.getvalue()}---\n"


def toml_block(fields: dict[str, Any]) -> str:
    return tomli_w.dumps(fields)


def fenced(content: str) -> str:
    return content.rstrip() + "\n"
