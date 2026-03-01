/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Users, 
  Play, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  Terminal,
  Layers
} from 'lucide-react';
import { orchestrateTask, AgentResult } from './services/agentService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [input, setInput] = useState('The colonization of Mars');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agents, setAgents] = useState<AgentResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-10));
  };

  const handleRun = async () => {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setLogs([]);
    addLog("Orchestrator initialized...");
    addLog(`Task received: "${input}"`);
    addLog("Splitting task into 5 parallel sub-tasks...");

    try {
      await orchestrateTask(input, (updatedAgents) => {
        setAgents(updatedAgents);
      });
      addLog("All agents completed. Aggregating results.");
    } catch (error) {
      addLog("Orchestration failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter uppercase italic font-serif">
            Agentic Orchestrator
          </h1>
          <p className="text-xs opacity-60 font-mono uppercase tracking-widest mt-1">
            Parallel Processing Loop v1.0.0
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 border border-[#141414] rounded-full text-[10px] font-mono uppercase">
            <span className={cn("w-2 h-2 rounded-full", isProcessing ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
            {isProcessing ? "System Active" : "System Idle"}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Control Panel */}
        <section className="lg:col-span-4 space-y-6">
          <div className="border border-[#141414] p-6 bg-white/50 backdrop-blur-sm">
            <h2 className="text-xs font-mono uppercase opacity-50 mb-4 flex items-center gap-2">
              <Terminal size={14} /> Input Controller
            </h2>
            <div className="space-y-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter a complex topic..."
                className="w-full h-32 bg-transparent border border-[#141414] p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] resize-none"
                disabled={isProcessing}
              />
              <button
                onClick={handleRun}
                disabled={isProcessing || !input.trim()}
                className={cn(
                  "w-full py-4 flex items-center justify-center gap-2 border border-[#141414] transition-all duration-200 uppercase text-xs font-bold tracking-widest",
                  isProcessing 
                    ? "bg-[#141414] text-[#E4E3E0] cursor-not-allowed" 
                    : "hover:bg-[#141414] hover:text-[#E4E3E0]"
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Execute Parallel Loop
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border border-[#141414] p-6 bg-white/50">
            <h2 className="text-xs font-mono uppercase opacity-50 mb-4">System Logs</h2>
            <div className="space-y-2 font-mono text-[10px] leading-relaxed">
              {logs.length === 0 && <p className="opacity-30 italic">Waiting for execution...</p>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="opacity-40 shrink-0">→</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Visualizer */}
        <section className="lg:col-span-8 space-y-8">
          {/* Orchestrator Node */}
          <div className="flex flex-col items-center">
            <motion.div 
              animate={isProcessing ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={cn(
                "w-24 h-24 border-2 border-[#141414] flex flex-col items-center justify-center relative z-10 bg-[#E4E3E0]",
                isProcessing && "bg-[#141414] text-[#E4E3E0]"
              )}
            >
              <Cpu size={32} />
              <span className="text-[10px] font-mono uppercase mt-2 font-bold">Orchestrator</span>
              
              {/* Connecting Lines (SVG) */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] h-20 -z-10 overflow-visible hidden md:block">
                <svg width="100%" height="100%" viewBox="0 0 600 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M300 0V40M300 40H50V80M300 40H175V80M300 40H425V80M300 40H550V80M300 40V80" stroke="#141414" strokeWidth="1" />
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Worker Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
            {Array.from({ length: 5 }).map((_, i) => {
              const agent = agents.find(a => a.agentId === i + 1);
              const status = agent?.status || 'pending';
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "border border-[#141414] p-4 flex flex-col items-center text-center transition-colors duration-300 min-h-[120px]",
                    status === 'processing' && "bg-amber-50 border-amber-500",
                    status === 'completed' && "bg-emerald-50 border-emerald-500",
                    status === 'error' && "bg-red-50 border-red-500"
                  )}
                >
                  <div className="mb-3">
                    {status === 'pending' && <Users size={20} className="opacity-30" />}
                    {status === 'processing' && <Loader2 size={20} className="animate-spin text-amber-500" />}
                    {status === 'completed' && <CheckCircle2 size={20} className="text-emerald-500" />}
                    {status === 'error' && <AlertCircle size={20} className="text-red-500" />}
                  </div>
                  <h3 className="text-[10px] font-mono uppercase font-bold mb-1">Agent {i + 1}</h3>
                  <p className="text-[9px] opacity-60 leading-tight">
                    {agent?.task.split(': ')[0] || "Awaiting Task..."}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Results Display */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono uppercase opacity-50 flex items-center gap-2">
              <Layers size={14} /> Agent Outputs
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {agents.filter(a => a.response).map((agent) => (
                  <motion.div
                    key={agent.agentId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border border-[#141414] bg-white p-6 relative group hover:shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] transition-all"
                  >
                    <div className="absolute top-0 right-0 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono px-3 py-1">
                      AGENT {agent.agentId}
                    </div>
                    <h4 className="text-xs font-bold font-serif italic mb-3 pr-20">
                      {agent.task}
                    </h4>
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed opacity-80">
                      <ReactMarkdown>{agent.response}</ReactMarkdown>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {!isProcessing && agents.length === 0 && (
                <div className="border border-dashed border-[#141414]/30 p-12 text-center">
                  <p className="text-sm opacity-40 italic">No data processed yet. Click 'Execute' to start the loop.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#141414] p-6 text-center">
        <p className="text-[10px] font-mono uppercase opacity-40 tracking-widest">
          Built with Gemini 3 Flash • Parallel Agentic Architecture
        </p>
      </footer>
    </div>
  );
}
