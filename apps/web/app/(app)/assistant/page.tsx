'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Zap,
  Bot,
  User,
  CheckCircle2,
  Terminal,
  FileText,
  Mail,
  UserCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  time: string;
  toolCall?: {
    toolName: string;
    params: string;
    result: string;
  };
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    sender: 'assistant',
    content:
      "Hello Shruvie! I'm your RecruitFlow AI Assistant. I can match candidates to open requisitions, generate tailored interview questions, draft personalized outreach/offer emails, and audit your pipeline metrics. How can I assist you today?",
    time: '2:40 PM',
  },
  {
    id: 'm2',
    sender: 'user',
    content: 'Which candidates have the highest match score for our Senior Full Stack Engineer opening?',
    time: '2:41 PM',
  },
  {
    id: 'm3',
    sender: 'assistant',
    content:
      'I evaluated all active profiles against the Senior Full Stack Engineer requisition criteria (Next.js, NestJS, TypeScript, PostgreSQL, and system design experience). Here are the top 2 candidates:',
    time: '2:41 PM',
    toolCall: {
      toolName: 'candidate_match_service.query',
      params: '{ jobId: "job_01", minScore: 90, requireSkills: ["TypeScript", "Next.js"] }',
      result: 'Found 2 matching profiles. Top: Sarah Chen (96%), James Wilson (97% - Offer Accepted).',
    },
  },
];

const PROMPT_SUGGESTIONS = [
  'Draft offer email for Marcus Vance ($215,000 base)',
  'Generate 5 system design interview questions for Sarah Chen',
  'Summarize candidates currently in Technical Interview stage',
  'What is our average time-to-hire across engineering roles?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (text?: string) => {
    const promptText = text || input;
    if (!promptText.trim()) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      content: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Simulate agent tool orchestration response
    setTimeout(() => {
      let responseContent = '';
      let toolCallData = undefined;

      if (promptText.toLowerCase().includes('offer') || promptText.toLowerCase().includes('marcus')) {
        toolCallData = {
          toolName: 'communication_provider.render_template',
          params: '{ candidateId: "cand_02", template: "OFFER_LETTER_FORMAL", salary: "$215,000" }',
          result: 'Offer template rendered with tenant legal disclaimer and benefits package.',
        };
        responseContent =
          "I've generated the formal offer letter for Marcus Vance for the AI/ML Research Scientist role. The package includes $215,000 base salary, 0.12% stock options, and standard full health coverage. You can send it directly through the Communication module with tenant audit tracking.";
      } else if (promptText.toLowerCase().includes('question') || promptText.toLowerCase().includes('sarah')) {
        toolCallData = {
          toolName: 'ai_orchestrator.generate_interview_rubric',
          params: '{ candidateId: "cand_01", stage: "TECHNICAL_INTERVIEW", difficulty: "SENIOR" }',
          result: '5 questions generated matching candidate GitHub profile and job requisitions.',
        };
        responseContent =
          "Here are 3 tailored technical questions for Sarah Chen's interview:\n\n1. Architecture: 'How would you architect tenant-isolated caching in Redis when multiple organizations share a single Redis cluster?'\n2. Next.js 15: 'Describe how Server Components and Server Actions change state management and error handling across boundaries.'\n3. PostgreSQL: 'How do you structure composite foreign keys and Row-Level Security policies to ensure zero tenant leakage at high QPS?'";
      } else {
        toolCallData = {
          toolName: 'knowledge_search.lookup',
          params: `{ query: "${promptText.slice(0, 30)}" }`,
          result: 'Retrieved matching records from tenant database.',
        };
        responseContent = `I processed your request: "${promptText}". All relevant data across your tenant database was analyzed with full security isolation. Would you like me to execute this action or generate an export?`;
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        content: responseContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolCall: toolCallData,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      {/* Assistant Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">RecruitFlow AI Co-Pilot</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30">
                Claude 3.5 Sonnet Reference Driver
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous recruitment intelligence with strict tenant data privacy and zero DB hallucination.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Agent Ready
          </span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs space-y-2.5 shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {/* Agent Tool Call Card */}
                {m.toolCall && (
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-violet-500/30 space-y-1.5 font-mono text-[10px]">
                    <div className="flex items-center justify-between text-violet-300">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-violet-400" />
                        <span className="font-bold">{m.toolCall.toolName}</span>
                      </div>
                      <span className="text-emerald-400 font-sans font-semibold">Executed</span>
                    </div>
                    <div className="text-slate-400 truncate">args: {m.toolCall.params}</div>
                    <div className="text-slate-300 border-t border-slate-800 pt-1">
                      {m.toolCall.result}
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-line leading-relaxed">{m.content}</div>

                <div
                  className={`text-[10px] text-right ${
                    isUser ? 'text-emerald-200' : 'text-slate-500'
                  }`}
                >
                  {m.time}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isThinking && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
              <span>Orchestrating agent tools & matching candidate embeddings...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2 pt-2">
        {PROMPT_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition text-[11px] flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-violet-400" />
            <span>{s}</span>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask RecruitFlow AI to match candidates, write questions, or draft emails..."
          className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 shadow-xl"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:hover:bg-violet-600 transition shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
