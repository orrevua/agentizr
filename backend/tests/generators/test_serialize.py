import tomllib

from ruamel.yaml.scalarstring import DoubleQuotedScalarString

from app.generators._serialize import fenced, toml_block, yaml_frontmatter


def test_yaml_frontmatter_quotes_strings_on_demand():
    out = yaml_frontmatter({"name": "foo", "tools": DoubleQuotedScalarString("Bash, Read")})
    assert out.startswith("---\n")
    assert out.endswith("---\n")
    assert 'tools: "Bash, Read"' in out


def test_yaml_frontmatter_preserves_insertion_order():
    out = yaml_frontmatter({"b": 1, "a": 2})
    body = out.split("---\n")[1]
    assert body.index("b:") < body.index("a:")


def test_toml_block_round_trips():
    raw = toml_block({"name": "x", "items": ["a", "b"]})
    assert tomllib.loads(raw) == {"name": "x", "items": ["a", "b"]}


def test_fenced_normalizes_trailing_newline():
    assert fenced("hello\n\n\n") == "hello\n"
    assert fenced("hello") == "hello\n"
