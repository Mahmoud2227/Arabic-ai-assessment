import json
import pytest
from conftest import test_state, log_metric

@pytest.mark.asyncio
async def test_07_verify_latencies():
    # We delay analysis of average speed until everything is complete
    metrics = test_state.get("metrics", [])
    if not metrics:
        return
        
    auth_latency = next((m["latency_ms"] for m in metrics if m["test"] == "auth_login"), 500)
    db_latency = next((m["latency_ms"] for m in metrics if m["test"] == "fetch_history"), 1000)
    
    log_metric("latency_check_auth", 0, auth_latency < 500, f"Auth latency {auth_latency:.2f}ms should be < 500ms")

    assert auth_latency < 500, f"Auth latency too high ({auth_latency}ms)"
    