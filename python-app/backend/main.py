import json

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from services.agent_service import orchestrate_task

load_dotenv()

app = FastAPI(title="Multi-Agent Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class OrchestrateRequest(BaseModel):
    topic: str


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/orchestrate")
async def orchestrate(request: OrchestrateRequest):
    async def event_generator():
        async for update in orchestrate_task(request.topic):
            yield {
                "event": "agent_update",
                "data": json.dumps(update),
            }
        yield {
            "event": "done",
            "data": json.dumps({}),
        }

    return EventSourceResponse(event_generator())
