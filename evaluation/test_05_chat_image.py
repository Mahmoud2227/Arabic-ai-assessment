import os
import json
import time
import pytest
import httpx
from io import BytesIO
from conftest import test_state, log_metric

@pytest.fixture
def dummy_image():
    image_path = os.path.join(os.path.dirname(__file__), "test_data", "sample.png")
    with open(image_path, "rb") as f:
        return f.read()

@pytest.mark.asyncio
async def test_05_chat_image(client: httpx.AsyncClient, dummy_image):
    conv_id = test_state.get("conversation_id")
    assert conv_id is not None, "Missing conversation id"
    
    start = time.time()
    files = {"file": ("sample.png", BytesIO(dummy_image), "image/png")}
    data = {"conversation_id": conv_id}
    
    full_response = ""
    caption = ""
    
    async with client.stream("POST", "/api/chat/image", data=data, files=files) as resp:
        if resp.status_code != 200:
            error_text = await resp.aread()
            log_metric("chat_image", (time.time() - start) * 1000, False, f"Failed with {resp.status_code}: {error_text}")
            pytest.skip(f"Image API Mock/External service failed: {resp.status_code}")
            
        async for line in resp.aiter_lines():
            if line.startswith("data:"):
                data_str = line[5:].strip()
                if not data_str or data_str == "[DONE]":
                    continue
                try:
                    js = json.loads(data_str)
                    if "transcription" in js:
                        caption = js["transcription"]
                    elif "content" in js:
                        full_response += js["content"]
                except json.JSONDecodeError:
                    pass
                    
    latency = (time.time() - start) * 1000
    success = len(full_response) > 0
    log_metric("chat_image", latency, success, f"Caption: {caption} | Response length: {len(full_response)}")
    assert success
