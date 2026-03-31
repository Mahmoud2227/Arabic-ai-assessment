# Arabic.AI Multimodal Chat Platform

A production-ready, full-stack multimodal AI chat application featuring real-time streaming, voice-to-text (ASR), and image-to-text (Vision) capabilities.

---

## 🚀 Features

- **Real-Time Streaming**: AI responses are streamed token-by-token for a smooth "typing" experience.
- **Multimodal Support**: 
  - **Text**: Advanced Arabic LLM chat.
  - **Audio**: Upload voice recordings for automatic speech recognition and AI response.
  - **Image**: Upload images for text extraction and visual understanding.
- **Robust Auth**: Secure JWT-based authentication with high-fidelity login and signup flows.
- **Enterprise Observability**: Centralized logging for all services (Backend, Frontend, DB, Evaluation).
- **Automated Evaluation**: 8 comprehensive test suites to ensure system reliability and performance.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TailwindCSS, Lucide Icons.
- **Backend**: FastAPI (Python 3.11), SQLAlchemy, PostgreSQL (asyncpg).
- **AI Services**: LongCat-Flash-Chat (LLM), FastScribe (ASR), Vision-API (OCR).
- **Infrastructure**: Docker & Docker Compose.

---

## 📋 Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.
- [Git](https://git-scm.com/) installed.

---

## ⚙️ Configuration

1. **Environment Variables**:
   Copy the example environment file and fill in your secrets.
   ```bash
   cp .env.example .env
   ```
   *Required:* You must provide a valid `LONGCAT_API_KEY` for the AI features to work.

---

## 🐳 Docker Usage

### Running the Application
To start the entire platform (Frontend, Backend, Database):
```bash
docker compose up -d
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Running the Evaluation Suite
The evaluation suite runs in a separate profile to save resources.
```bash
docker compose --profile eval up --build
```
This will run all automated tests and generate a report in the `./logs/evaluation/` directory.

---

## 🧪 Testing & Evaluation

The system includes 8 dedicated evaluation suites:

| Suite | Description |
|---|---|
| **01 Auth** | Verifies login, signup, and JWT token security. |
| **02 Conversations** | Tests conversation creation, retrieval, and deletion. |
| **03 Chat Text** | Validates real-time streaming for plain text queries. |
| **04 Chat Audio** | Tests the FastScribe integration (ASR) and response generation. |
| **05 Chat Image** | Tests the Vision API integration (OCR) and visual chat. |
| **06 Robustness** | Checks system recovery after network failures or invalid inputs. |
| **07 Latency** | Measures end-to-end response times for all modalities. |
| **08 Persistence** | Ensures chat history persists across service restarts. |

---

## 📂 Project Structure

```text
├── backend/            # FastAPI source code
├── frontend/           # Next.js 14 source code
├── evaluation/         # Automated test suites & test data
├── logs/               # Persistent log storage (Docker-mapped)
├── docker-compose.yml  # Container orchestration
├── .env.example        # Environment template
└── README.md           # This file!
```

---

## 📊 Observability

Logs are persisted on the host in the `./logs/` directory:
- **Backend**: `./logs/backend/backend.log`
- **Frontend**: `./logs/frontend/frontend.log`
- **Database**: `./logs/db/postgresql.log`
- **Evaluation**: `./logs/evaluation/evaluation.log`

---

## 🛡️ License
Proprietary. Developed for the Arabic AI Multimodal Assessment.
