import time
import pytest
import httpx
from conftest import test_state, log_metric

@pytest.mark.asyncio
async def test_08_verify_persistence(client: httpx.AsyncClient):
    conv_id = test_state.get("conversation_id")
    assert conv_id is not None, "Memory check requires a prior conversation"
    
    # Simulate a reload by fetching history
    start = time.time()
    resp = await client.get(f"/api/conversations/{conv_id}")
    latency = (time.time() - start) * 1000
    
    success = resp.status_code == 200
    log_metric("persistence_check_history", latency, success)
    assert success
    
    data = resp.json()
    messages = data.get("messages", [])
    
    # We expect at least the initial chat_text pair (user + assistant)
    # Plus potentially audio or image pairs if those tests ran
    has_assistant_msg = any(m["role"] == "assistant" for m in messages)
    count = len(messages)
    
    persistence_success = count >= 2 and has_assistant_msg
    log_metric("persistence_verified", 0, persistence_success, f"Found {count} messages. Assistant message present: {has_assistant_msg}")
    
    assert persistence_success, f"Persistence failed: Found only {count} messages, assistant message presence: {has_assistant_msg}"
