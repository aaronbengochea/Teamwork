# Multi-Agent Orchestrator (Python + React)

A Python port of the Multi-Agent Orchestrator. FastAPI backend handles Gemini AI orchestration and streams real-time status updates to the React frontend via Server-Sent Events.

## Architecture

```
Browser (React) --SSE--> FastAPI --async--> Gemini API
                                     x5 parallel agents
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- Google Gemini API key

## Setup

### Backend

```bash
cd python-app/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Frontend

```bash
cd python-app/frontend
npm install
```

## Running

Start both processes:

```bash
# Terminal 1: Backend (port 8000)
cd python-app/backend
source venv/bin/activate
uvicorn main:app --port 8000 --reload

# Terminal 2: Frontend (port 3000)
cd python-app/frontend
npm run dev
```

Open http://localhost:3000

## How It Works

1. User enters a topic and clicks Execute
2. React sends POST to `/api/orchestrate`
3. FastAPI splits the topic into 5 analytical perspectives
4. 5 async agents call Gemini in parallel
5. Status updates stream back via SSE as agents progress
6. React renders real-time status changes and markdown results
