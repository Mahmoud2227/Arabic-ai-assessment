FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run pytest on container start and output report
CMD ["python", "run_evaluation.py"]
