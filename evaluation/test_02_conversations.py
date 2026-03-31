import time
import pytest
import httpx
from conftest import test_state, log_metric

@pytest.mark.asyncio
async def test_02_create_conversation(client: httpx.AsyncClient):
    # Relies on the client automatically injecting the test_state token
    assert test_state.get("token"), "No auth token found, auth test may have failed"
    
    start = time.time()
    resp = await client.post("/api/conversations", json={"title": "Eval Thread"})
    latency = (time.time() - start) * 1000
    
    success = resp.status_code == 200
    log_metric("create_conversation", latency, success)
    assert success
    
    data = resp.json()
    test_state["conversation_id"] = data["id"]
    assert data["title"] == "Eval Thread"


