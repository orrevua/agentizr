from app.catalog.models import MODELS


def test_unique_ids():
    ids = [m.id for m in MODELS]
    assert len(ids) == len(set(ids))


def test_all_have_platforms():
    for m in MODELS:
        assert m.platforms
