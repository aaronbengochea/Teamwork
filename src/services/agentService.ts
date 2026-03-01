import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AgentResult {
  agentId: number;
  task: string;
  response: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export async function orchestrateTask(
  mainTask: string,
  onUpdate: (results: AgentResult[]) => void
) {
  // 1. Orchestrator splits the task
  // For this simple example, we'll assume the task is a list of 5 items to process
  // In a real scenario, the orchestrator would use LLM to split the task.
  
  const subTasks = [
    `Analyze the historical context of: ${mainTask}`,
    `Analyze the economic impact of: ${mainTask}`,
    `Analyze the social implications of: ${mainTask}`,
    `Analyze the future trends of: ${mainTask}`,
    `Analyze the ethical considerations of: ${mainTask}`,
  ];

  const results: AgentResult[] = subTasks.map((task, i) => ({
    agentId: i + 1,
    task,
    response: "",
    status: 'pending'
  }));

  onUpdate([...results]);

  // 2. Parallel execution of 5 agents
  const agentPromises = subTasks.map(async (task, i) => {
    results[i].status = 'processing';
    onUpdate([...results]);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are Worker Agent #${i + 1}. Your specific task is: ${task}. Be concise (max 3 sentences).`,
      });

      results[i].response = response.text || "No response";
      results[i].status = 'completed';
    } catch (error) {
      console.error(`Agent ${i + 1} failed:`, error);
      results[i].status = 'error';
      results[i].response = "Error occurred during processing.";
    }
    onUpdate([...results]);
  });

  await Promise.all(agentPromises);
  
  // 3. Final aggregation (optional step for the orchestrator)
  return results;
}
