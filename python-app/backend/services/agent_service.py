import asyncio
import os
from dataclasses import dataclass
from typing import AsyncGenerator

from google import genai


@dataclass
class AgentResult:
    agent_id: int
    task: str
    response: str = ""
    status: str = "pending"  # pending | processing | completed | error


SUB_TASK_TEMPLATES = [
    "Analyze the historical context of: {}",
    "Analyze the economic impact of: {}",
    "Analyze the social implications of: {}",
    "Analyze the future trends of: {}",
    "Analyze the ethical considerations of: {}",
]


async def run_single_agent(
    client: genai.Client,
    agent_id: int,
    task: str,
    results: list[AgentResult],
    queue: asyncio.Queue,
) -> None:
    """Run a single agent: mark processing, call Gemini, mark completed/error."""
    results[agent_id].status = "processing"
    await queue.put(agent_id)

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"You are Worker Agent #{agent_id + 1}. Your specific task is: {task}. Be concise (max 3 sentences).",
        )
        results[agent_id].response = response.text or "No response"
        results[agent_id].status = "completed"
    except Exception as e:
        print(f"Agent {agent_id + 1} failed: {e}")
        results[agent_id].status = "error"
        results[agent_id].response = "Error occurred during processing."

    await queue.put(agent_id)


async def orchestrate_task(topic: str) -> AsyncGenerator[dict, None]:
    """
    Orchestrate 5 parallel agents analyzing a topic.
    Yields SSE-ready dicts as agents change status.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    client = genai.Client(api_key=api_key)

    sub_tasks = [t.format(topic) for t in SUB_TASK_TEMPLATES]

    results = [
        AgentResult(agent_id=i, task=task)
        for i, task in enumerate(sub_tasks)
    ]

    # Yield initial pending state for all agents
    for r in results:
        yield _result_to_dict(r)

    # Queue for agents to signal state changes
    queue: asyncio.Queue[int] = asyncio.Queue()

    # Launch all agents in parallel
    tasks = [
        asyncio.create_task(
            run_single_agent(client, i, sub_tasks[i], results, queue)
        )
        for i in range(5)
    ]

    # Yield updates as they come in (5 agents x 2 updates each = 10 events)
    updates_remaining = 10
    while updates_remaining > 0:
        agent_id = await queue.get()
        yield _result_to_dict(results[agent_id])
        updates_remaining -= 1

    # Ensure all tasks are done
    await asyncio.gather(*tasks)


def _result_to_dict(r: AgentResult) -> dict:
    return {
        "agentId": r.agent_id + 1,
        "task": r.task,
        "response": r.response,
        "status": r.status,
    }
