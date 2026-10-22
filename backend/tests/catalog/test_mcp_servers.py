from app.catalog.mcp_servers import MCP_SERVERS


def test_four_entries():
    assert len(MCP_SERVERS) == 4


def test_unique_names():
    names = [s.name for s in MCP_SERVERS]
    assert len(names) == len(set(names))
