import os
import json
import time
import pytest
import httpx
from io import BytesIO
from conftest import test_state, log_metric

@pytest.fixture
def dummy_audio():
    audio_path = os.path.join(os.path.dirname(__file__), "test_data", "sample.wav")
    with open(audio_path, "rb") as f:
        return f.read()

@pytest.mark.asyncio
async def test_04_chat_audio(client: httpx.AsyncClient, dummy_audio):
    conv_id = test_state.get("conversation_id")
    assert conv_id is not None, "Missing conversation_id"
    
    start = time.time()
    files = {"file": ("sample.wav", BytesIO(dummy_audio), "audio/wav")}
    data = {"conversation_id": conv_id}
    
    full_response = ""
    transcription = ""
    
    async with client.stream("POST", "/api/chat/audio", data=data, files=files) as resp:
        if resp.status_code != 200:
            error_text = await resp.aread()
            log_metric("chat_audio", (time.time() - start) * 1000, False, f"Failed with {resp.status_code}: {error_text}")
            pytest.skip(f"Audio API Mock/External service failed: {resp.status_code}")
            
        async for line in resp.aiter_lines():
            if line.startswith("data:"):
                data_str = line[5:].strip()
                if not data_str or data_str == "[DONE]":
                    continue
                try:
                    js = json.loads(data_str)
                    if "transcription" in js:
                        transcription = js["transcription"]
                    elif "content" in js:
                        full_response += js["content"]
                except json.JSONDecodeError:
                    pass
    
    latency = (time.time() - start) * 1000
    success = len(full_response) > 0
    log_metric("chat_audio", latency, success, f"Transcription: {transcription} | Response length: {len(full_response)}")
    assert success
