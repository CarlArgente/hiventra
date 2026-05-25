"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Briefcase,
  User,
  Globe,
  ChevronDown,
  MessageSquare,
  Loader2,
  X,
} from "lucide-react";
import {
  createChatSession,
  deleteChatSession,
  getSessionMessages,
  saveMessage,
  updateSessionTitle,
} from "@/app/actions/carl-chat";
import type { ChatSession, ChatMessage } from "@/app/actions/carl-chat";

interface Job {
  id: string;
  title: string;
  department: string | null;
  status: string;
}

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  stage: string;
  ai_score: number | null;
  job_id: string;
  jobs: { title: string } | null;
}

interface Props {
  initialSessions: ChatSession[];
  jobs: Job[];
  candidates: Candidate[];
}

type ContextType = "general" | "job" | "candidate";

const SUGGESTED_PROMPTS = [
  "Which candidates should I prioritize this week?",
  "Give me a pipeline health summary across all jobs.",
  "Who are the top-scoring candidates ready for next steps?",
  "Are there any candidates I should reject based on their scores?",
  "What's the average AI score across all active jobs?",
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return "Today";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function CarlAvatar({ size = "sm" }: { size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-10 h-10 text-base" : "w-7 h-7 text-xs";
  return (
    <div className={`${cls} rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0`}>
      C
    </div>
  );
}

function ContextBadge({ type, label }: { type: ContextType; label: string }) {
  const colors: Record<ContextType, string> = {
    general: "bg-slate-100 text-slate-600",
    job: "bg-indigo-100 text-indigo-700",
    candidate: "bg-emerald-100 text-emerald-700",
  };
  const icons: Record<ContextType, React.ReactNode> = {
    general: <Globe className="w-3 h-3" />,
    job: <Briefcase className="w-3 h-3" />,
    candidate: <User className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors[type]}`}>
      {icons[type]}
      {label}
    </span>
  );
}

export default function TalkWithCarlClient({ initialSessions, jobs, candidates }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [contextType, setContextType] = useState<ContextType>("general");
  const [contextJobId, setContextJobId] = useState<string>("");
  const [contextCandidateId, setContextCandidateId] = useState<string>("");
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoadingSession(true);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setContextType(session.context_type);
      setContextJobId(session.context_job_id ?? "");
      setContextCandidateId(session.context_candidate_id ?? "");
    }
    const msgs = await getSessionMessages(sessionId);
    setMessages(msgs);
    setActiveSessionId(sessionId);
    setLoadingSession(false);
  }, [sessions]);

  const startNewChat = async () => {
    const contextLabel =
      contextType === "job" && contextJobId
        ? jobs.find((j) => j.id === contextJobId)?.title ?? "New Chat"
        : contextType === "candidate" && contextCandidateId
        ? candidates.find((c) => c.id === contextCandidateId)?.full_name ?? "New Chat"
        : "New Chat";

    const { session } = await createChatSession(
      contextLabel,
      contextType,
      contextJobId || undefined,
      contextCandidateId || undefined
    );
    if (session) {
      setSessions((prev) => [session, ...prev]);
      setMessages([]);
      setActiveSessionId(session.id);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteChatSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setInput("");

    let sessionId = activeSessionId;
    let currentSessions = sessions;

    // Auto-create session if none active
    if (!sessionId) {
      const label =
        contextType === "job" && contextJobId
          ? jobs.find((j) => j.id === contextJobId)?.title ?? "New Chat"
          : contextType === "candidate" && contextCandidateId
          ? candidates.find((c) => c.id === contextCandidateId)?.full_name ?? "New Chat"
          : "New Chat";

      const { session } = await createChatSession(
        label,
        contextType,
        contextJobId || undefined,
        contextCandidateId || undefined
      );
      if (!session) return;
      sessionId = session.id;
      currentSessions = [session, ...sessions];
      setSessions(currentSessions);
      setActiveSessionId(sessionId);
    }

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    // Persist user message
    await saveMessage(sessionId, "user", content);

    // Auto-title on first message
    const session = currentSessions.find((s) => s.id === sessionId);
    if (session && session.title === "New Chat" && messages.length === 0) {
      const autoTitle = content.length > 40 ? content.slice(0, 40) + "…" : content;
      await updateSessionTitle(sessionId, autoTitle);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: autoTitle } : s))
      );
    }

    // Build messages array for API (existing + new user msg)
    const allMessages = [
      ...messages.filter((m) => !m.id.startsWith("temp-")),
      tempUserMsg,
    ].map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/carl-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: allMessages,
          contextType,
          contextJobId: contextJobId || undefined,
          contextCandidateId: contextCandidateId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");

      const assistantMsg: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        session_id: sessionId,
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessage(sessionId, "assistant", data.reply);

      // Update session updated_at locally
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, updated_at: new Date().toISOString() } : s
        )
      );
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          session_id: sessionId!,
          role: "assistant",
          content: "Sorry, I ran into an issue. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const contextLabel =
    contextType === "job" && contextJobId
      ? jobs.find((j) => j.id === contextJobId)?.title ?? "Job"
      : contextType === "candidate" && contextCandidateId
      ? candidates.find((c) => c.id === contextCandidateId)?.full_name ?? "Candidate"
      : "All Data";

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } shrink-0 transition-all duration-200 overflow-hidden border-r border-slate-200 bg-white flex flex-col`}
      >
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {sessions.length === 0 && (
            <p className="text-xs text-slate-400 px-2 py-4 text-center">No conversations yet</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => loadSession(s.id)}
              onKeyDown={(e) => e.key === "Enter" && loadSession(s.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg group flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                activeSessionId === s.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate leading-tight">{s.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(s.updated_at)}</p>
              </div>
              <button
                onClick={(e) => handleDeleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity shrink-0 mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat header */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <CarlAvatar size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Carl</p>
              <p className="text-xs text-slate-500 truncate">AI Talent Intelligence Assistant</p>
            </div>
          </div>

          {/* Context selector */}
          <div className="relative" ref={contextMenuRef}>
            <button
              onClick={() => setContextMenuOpen(!contextMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
            >
              <ContextBadge type={contextType} label={contextLabel} />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {contextMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Carl's Context</p>

                {/* General */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="ctx"
                    checked={contextType === "general"}
                    onChange={() => { setContextType("general"); setContextJobId(""); setContextCandidateId(""); }}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-700">All Data</p>
                    <p className="text-xs text-slate-500">Carl sees all jobs and pipeline stats</p>
                  </div>
                </label>

                {/* Job context */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="ctx"
                    checked={contextType === "job"}
                    onChange={() => { setContextType("job"); setContextCandidateId(""); }}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Specific Job</p>
                    <p className="text-xs text-slate-500 mb-1.5">Carl focuses on one job and its candidates</p>
                    {contextType === "job" && (
                      <select
                        value={contextJobId}
                        onChange={(e) => setContextJobId(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="">Select a job…</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title} ({j.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>

                {/* Candidate context */}
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="ctx"
                    checked={contextType === "candidate"}
                    onChange={() => { setContextType("candidate"); setContextJobId(""); }}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Specific Candidate</p>
                    <p className="text-xs text-slate-500 mb-1.5">Carl dives deep into one candidate's profile & interview</p>
                    {contextType === "candidate" && (
                      <select
                        value={contextCandidateId}
                        onChange={(e) => setContextCandidateId(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      >
                        <option value="">Select a candidate…</option>
                        {candidates.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.full_name} — {c.jobs?.title ?? "N/A"} ({c.stage})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>

                <button
                  onClick={() => setContextMenuOpen(false)}
                  className="w-full mt-1 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {loadingSession ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : isEmpty ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
                C
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Hi, I'm Carl</h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Your AI Talent Intelligence assistant. Ask me anything about your jobs, candidates, pipeline health, or hiring decisions — I have access to your real platform data.
              </p>

              <div className="w-full space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Try asking…</p>
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl text-sm text-slate-700 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto w-full">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" ? (
                    <CarlAvatar />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-sm whitespace-pre-wrap"
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        msg.content
                      ) : (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            h2: ({ children }) => <p className="font-bold text-slate-900 mt-3 mb-1 first:mt-0">{children}</p>,
                            h3: ({ children }) => <p className="font-semibold text-slate-800 mt-2 mb-0.5">{children}</p>,
                            code: ({ children }) => <code className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <CarlAvatar />
                  <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-slate-200 px-4 py-3">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Carl about your pipeline, candidates, or jobs…"
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none max-h-32"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 128) + "px";
                }}
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Carl uses real data from your Hiventra platform. Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
