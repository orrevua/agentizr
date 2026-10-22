import io
import zipfile
from collections.abc import Iterator

from app.domain.generated import GeneratedFile

_CHUNK = 64 * 1024
_DETERMINISTIC_MTIME = (1980, 1, 1, 0, 0, 0)


def stream_zip(files: list[GeneratedFile]) -> Iterator[bytes]:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            info = zipfile.ZipInfo(filename=f.path, date_time=_DETERMINISTIC_MTIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, f.content.encode("utf-8"))

    buf.seek(0)
    while chunk := buf.read(_CHUNK):
        yield chunk
