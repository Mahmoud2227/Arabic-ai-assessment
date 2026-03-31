import time
import pytest
import httpx
from conftest import test_state, log_metric

@pytest.mark.asyncio
async def test_01_health_check(client: httpx.AsyncClient):
    start = time.time()
    resp = await client.get("/api/health")
    latency = (time.time() - start) * 1000
    success = resp.status_code == 200
    log_metric("health_check", latency, success, f"Status: {resp.status_code}")
    assert success

@pytest.mark.asyncio
async def test_01_register_and_login(client: httpx.AsyncClient):
    import uuid
    username = f"testuser_{uuid.uuid4().hex[:8]}"
    email = f"{username}@example.com"
    password = "password123"

    # Register
    start = time.time()
    reg_resp = await client.post("/api/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    latency = (time.time() - start) * 1000
    
    success = reg_resp.status_code == 200
    log_metric("auth_register", latency, success)
    assert success
    
    # Login
    start = time.time()
    login_resp = await client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    latency = (time.time() - start) * 1000
    
    success = login_resp.status_code == 200
    log_metric("auth_login", latency, success)
    assert success
    
    data = login_resp.json()
    test_state["token"] = data["access_token"]
    test_state["user_id"] = data["user"]["id"]
