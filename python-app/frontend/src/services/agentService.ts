export interface AgentResult {
  agentId: number;
  task: string;
  response: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export async function orchestrateTask(
  mainTask: string,
  onUpdate: (results: AgentResult[]) => void
): Promise<AgentResult[]> {
  const results: AgentResult[] = [];

  const response = await fetch('/api/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic: mainTask }),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    let currentEvent = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const data = line.slice(5).trim();

        if (currentEvent === 'done') {
          return results;
        }

        if (currentEvent === 'agent_update' && data) {
          const update: AgentResult = JSON.parse(data);

          const existingIndex = results.findIndex(
            (r) => r.agentId === update.agentId
          );
          if (existingIndex >= 0) {
            results[existingIndex] = update;
          } else {
            results.push(update);
          }

          onUpdate([...results]);
        }

        currentEvent = '';
      }
    }
  }

  return results;
}
