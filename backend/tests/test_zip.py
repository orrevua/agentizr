import io
import zipfile

from app.domain.generated import GeneratedFile
from app.zip import stream_zip


def test_stream_zip_round_trips():
    files = [
        GeneratedFile(path="a/b.md", content="hello", platform="universal", language="markdown"),
        GeneratedFile(path="c.toml", content="x = 1", platform="codex", language="toml"),
    ]
    data = b"".join(stream_zip(files))
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        names = zf.namelist()
        assert names == ["a/b.md", "c.toml"]
        assert zf.read("a/b.md") == b"hello"
        assert zf.read("c.toml") == b"x = 1"


def test_stream_zip_deterministic():
    files = [GeneratedFile(path="x", content="y", platform="universal", language="text")]
    a = b"".join(stream_zip(files))
    b = b"".join(stream_zip(files))
    assert a == b
