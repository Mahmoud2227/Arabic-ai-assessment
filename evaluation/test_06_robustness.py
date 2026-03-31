import time
import pytest
import httpx
from io import BytesIO
from conftest import test_state, log_metric

@pytest.mark.asyncio
async def test_06_invalid_token(client: httpx.AsyncClient):
    # Create a fresh client without the token injected
    async with httpx.AsyncClient(base_url=client.base_url) as anon_client:
        anon_client.headers.update({"Authorization": "Bearer BAD_TOKEN"})
        
        start = time.time()
        resp = await anon_client.get("/api/conversations")
        latency = (time.time() - start) * 1000
        
        success = resp.status_code == 401
        log_metric("robustness_invalid_token", latency, success, f"Expected 401, got {resp.status_code}")
        assert success

@pytest.mark.asyncio
async def test_06_missing_conversation_id(client: httpx.AsyncClient):
    start = time.time()
    payload = {"query": "Hello without conversation id"}
    # The Pydantic model requires conversation_id
    resp = await client.post("/api/chat/text", json=payload)
    latency = (time.time() - start) * 1000
    
    success = resp.status_code == 422
    log_metric("robustness_missing_field", latency, success, f"Expected 422 Unprocessable Entity, got {resp.status_code}")
    assert success