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
  // TODO: implement SSE client in Task 5
  return [];
}
