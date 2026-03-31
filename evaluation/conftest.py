import os
import json
import time
import logging
import pytest
import httpx
from typing import AsyncGenerator

logger = logging.getLogger("eval")
API_URL = os.environ.get("API_URL", "http://backend:8000")

test_state = {
    "token": "",
    "user_id": "",
    "conversation_id": "",
    "metrics": []
}

def log_metric(test_name: str, latency_ms: float, success: bool, details: str = ""):
    logger.info(f"METRIC: {test_name} | Latency: {latency_ms:.2f}ms | Success: {success} | Details: {details}")
    test_state["metrics"].append({
        "test": test_name,
        "latency_ms": latency_ms,
        "success": success,
        "details": details,
        "timestamp": time.time()
    })

@pytest.fixture(scope="session", autouse=True)
def save_report():
    yield
    report_path = "/app/logs/evaluation_report.json"
    with open(report_path, "w") as f:
        json.dump(test_state["metrics"], f, indent=2)
    logger.info(f"Saved evaluation report to {report_path}")

@pytest.fixture
async def client() -> AsyncGenerator[httpx.AsyncClient, None]:
    async with httpx.AsyncClient(base_url=API_URL, timeout=120.0) as client:
        if test_state["token"]:
            client.headers.update({"Authorization": f"Bearer {test_state['token']}"})
        yield client
