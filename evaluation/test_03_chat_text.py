import json
import time
import pytest
import httpx
from conftest import test_state, log_metric, logger

@pytest.mark.asyncio
async def test_03_chat_text(client: httpx.AsyncClient):
    conv_id = test_state.get("conversation_id")
    assert conv_id is not None, "Ensure test_conversations.py runs first"
    
    query = "How many continents are on Earth?"
    payload = {"conversation_id": conv_id, "query": query}
    
    start = time.time()
    full_response = ""
    # using stream method to consume SSE
    async with client.stream("POST", "/api/chat/text", json=payload) as resp:
        if resp.status_code != 200:
            error_text = await resp.aread()
            log_metric("chat_text", (time.time() - start) * 1000, False, f"Failed with {resp.status_code}: {error_text}")
            pytest.fail(f"Text API Mock/External service failed: {resp.status_code}")

        async for line in resp.aiter_lines():
            if line.startswith("data:"):
                data_str = line[5:].strip()
                if not data_str or data_str == "[DONE]":
                    continue
                try:
                    data = json.loads(data_str)
                    if "content" in data:
                        full_response += data["content"]
                except json.JSONDecodeError:
                    pass
    
    latency = (time.time() - start) * 1000
    success = len(full_response) > 0
    log_metric("chat_text", latency, success, f"Response length: {len(full_response)}")
    assert success
    # add latency check
    assert latency < 20000, "Latency is too high"
    logger.info(f"AI Response Snippet: {full_response[:100]}...")
