import os
import sys
import subprocess
import logging
import time
import httpx
from logging.handlers import RotatingFileHandler

# Configure logging
LOG_DIR = "/app/logs"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "evaluation.log")

log_formatter = logging.Formatter("%(asctime)s | %(levelname)-5s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(log_formatter)

# File handler
file_handler = RotatingFileHandler(LOG_FILE, maxBytes=5*1024*1024, backupCount=2)
file_handler.setFormatter(log_formatter)

logging.basicConfig(level=logging.INFO, handlers=[console_handler, file_handler])
logger = logging.getLogger("eval_orchestrator")

def wait_for_backend():
    logger.info("⏳ Waiting for backend to become available...")
    api_url = os.environ.get("API_URL", "http://backend:8000")
    for _ in range(30): # Wait up to 30 seconds
        try:
            resp = httpx.get(f"{api_url}/api/health", timeout=1.0)
            if resp.status_code == 200:
                logger.info("✅ Backend is up!")
                return
        except BaseException:
            pass
        time.sleep(1)
    logger.error("❌ Backend did not become available in time.")
    sys.exit(1)

def main():
    wait_for_backend()
    logger.info("🚀 Starting Arabic AI Automated Evaluation Suite...")
    
    # Run pytest directly and capture exit code
    pytest_args = ["pytest", "-v", "--tb=short", "--disable-warnings"]
    result = subprocess.run(pytest_args)
    
    # Run the report generator
    logger.info("📝 Generating Markdown Report...")
    subprocess.run(["python", "report_generator.py"])
    
    logger.info("\n✅ Evaluation complete!")
    report_path = "/app/logs/evaluation_report.md"
    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            print(f.read())
            
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
