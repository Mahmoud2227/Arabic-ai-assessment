import os
import json
import httpx
import logging
from typing import AsyncGenerator

logger = logging.getLogger("ai_client")

CHAT_API_URL = os.getenv("CHAT_API_URL", "https://api.longcat.chat/openai/v1/chat/completions")
LONGCAT_API_KEY = os.getenv("LONGCAT_API_KEY", "your-longcat-api-key-here")
FASTSCRIBE_URL = os.getenv("FASTSCRIBE_URL", "https://fastscribe.tarjama.com/api/asr/")
VISION_API_URL = os.getenv("VISION_API_URL", "https://vision-api.arabic.ai/vision/extract")


async def stream_chat(
    messages: list[dict],
    user_id: str = "arabic.ai",
) -> AsyncGenerator[str, None]:
    """
    Stream chat response from OpenAI-compatible API via SSE.
    Yields text chunks as they arrive.
    """
    logger.info(f"Starting AI stream for user {user_id} with {len(messages)} messages")
    payload = {
        "model": "LongCat-Flash-Chat",
        "messages": messages,
        "stream": True,
        "user": user_id,
    }
    headers = {
        "Authorization": f"Bearer {LONGCAT_API_KEY}",
        "Content-Type": "application/json",
    }

    full_response = ""
    remote_conversation_id = ""

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", CHAT_API_URL, json=payload, headers=headers) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data_str = line[5:].strip()
                    if not data_str or data_str == "[DONE]":
                        continue
                    try:
                        data = json.loads(data_str)
                        choices = data.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content", "")
                            if content:
                                full_response += content
                                yield content

                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse SSE data: {data_str}")
                        continue
                
                logger.info(f"AI stream finished for user {user_id} ({len(full_response)} chars)")
                # Yield metadata as a special JSON event (kept for backend _stream_and_save compat)
                yield f"\n__META__:{json.dumps({'full_response': full_response})}"

    except httpx.HTTPStatusError as e:
        logger.error(f"Chat API HTTP error: {e.response.status_code} - {e.response.text}")
        yield f"Error: Chat API returned status {e.response.status_code}"
    except Exception as e:
        logger.error(f"Chat API error: {str(e)}")
        yield f"Error: {str(e)}"


async def transcribe_audio(file_bytes: bytes, filename: str) -> dict:
    """
    Transcribe audio using Fastscribe ASR API.
    Returns: {'success': bool, 'transcript': str, 'error': str|None}
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"file": (filename, file_bytes, "audio/wav")}
            response = await client.post(FASTSCRIBE_URL, files=files)
            response.raise_for_status()
            result = response.json()
            result['success'] = True
            logger.info(f"ASR response: {result}")
            return result
    except httpx.HTTPStatusError as e:
        logger.error(f"ASR API HTTP error: {e.response.status_code}")
        return {"success": False, "transcript": "", "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"ASR API error: {str(e)}")
        return {"success": False, "transcript": "", "error": str(e)}


async def extract_image_text(file_bytes: bytes, filename: str, prompt: str = "Extract all the text present in this image. Output only the extracted text.") -> dict:
    """
    Extract text / generate description from image using Vision API.
    Returns: {'success': bool, 'extracted_text': str, 'error': str|None}
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"image": (filename, file_bytes, "image/png")}
            data = {"prompt": prompt}
            response = await client.post(VISION_API_URL, files=files, data=data)
            response.raise_for_status()
            result = response.json()
            logger.info(f"Vision API response: {result}")
            return result
    except httpx.HTTPStatusError as e:
        logger.error(f"Vision API HTTP error: {e.response.status_code}")
        return {"success": False, "extracted_text": "", "error": f"HTTP {e.response.status_code}"}
    except Exception as e:
        logger.error(f"Vision API error: {str(e)}")
        return {"success": False, "extracted_text": "", "error": str(e)}
