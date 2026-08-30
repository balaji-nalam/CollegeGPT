import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AppShell from '../components/AppShell/AppShell';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AnswerRenderer from '../components/Chat/AnswerRenderer';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  Send,
  Plus,
  Trash2,
  BookOpen,
  MessageSquare,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Clock,
  Layers,
  Copy,
  Check,
  ChevronDown,
  Search,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  'What is the minimum attendance requirement?',
  'What is NumPy?',
  'Give me the information from Week 1 Experiential Learning',
  'What are the learning outcomes?',
];

export default function StudentChatPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [conversationSearch, setConversationSearch] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(null);
  const [sourcesOpen, setSourcesOpen] = useState({});
  const [error, setError] = useState(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load user conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages when active conversation changes
  const loadConversationMessages = async (convId) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    try {
      setLoadingHistory(true);
      const res = await api.get(`/conversations/${convId}`);
      setMessages(res.data?.data?.messages || []);
      setActiveConversationId(convId);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInputText('');
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await api.delete(`/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const isSimpleGreeting = (value) => {
    const normalized = value.trim().toLowerCase().replace(/[^a-z\s]/g, '');
    const greetings = [
      'hi',
      'hello',
      'hey',
      'good morning',
      'good afternoon',
      'good evening',
    ];

    return greetings.includes(normalized) || normalized.split(/\s+/).filter(Boolean).every((word) => ['hi', 'hello', 'hey', 'morning', 'afternoon', 'evening', 'good'].includes(word));
  };

  const sendQuestion = async (questionOverride) => {
    const question = (questionOverride ?? inputText).trim();
    if (!question || loading) return;

    setError(null);
    setLastFailedQuestion(question);
    setInputText('');

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    if (isSimpleGreeting(question)) {
      const greetingReply = {
        id: `greeting-${Date.now()}`,
        sender: 'assistant',
        content: "Hi! I'm CollegeGPT. Ask me anything about your college documents, academic policies, courses, attendance, experiential learning, or other information available in the knowledge base.",
        is_fallback: false,
        sources: [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, greetingReply]);
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/chat', {
        conversationId: activeConversationId || undefined,
        message: question,
      });

      const { conversationId, message } = res.data.data;

      if (!activeConversationId) {
        setActiveConversationId(conversationId);
        fetchConversations();
      }

      const assistantMsg = {
        id: message.id,
        sender: 'assistant',
        content: message.answer,
        is_fallback: !message.supported,
        sources: message.sources || [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Sorry, something went wrong while fetching the answer.';
      setError(errorMessage);
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: errorMessage,
        is_fallback: true,
        sources: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    await sendQuestion();
  };

  const handleRetryQuestion = async () => {
    if (!lastFailedQuestion) return;
    setError(null);
    await sendQuestion(lastFailedQuestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyAnswer = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessage(id);
      setTimeout(() => setCopiedMessage(null), 1800);
    } catch { /* Clipboard permission is optional; the response remains selectable. */ }
  };

  const filteredConversations = conversations.filter((conversation) =>
    conversation.title?.toLowerCase().includes(conversationSearch.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <AppShell>
        <Head>
          <title>Academic Assistant | CollegeGPT</title>
        </Head>

        <div className="flex h-[calc(100vh-4.5rem)] overflow-hidden bg-slate-950 text-slate-100">
          {/* Conversation History Sidebar */}
          <aside className="w-80 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-xl flex flex-col h-full hidden md:flex">
            <div className="p-4 border-b border-slate-800">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                New Consultation
              </button>
              <label className="relative mt-3 block">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input value={conversationSearch} onChange={(e) => setConversationSearch(e.target.value)} placeholder="Search consultations" className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2 pl-8 pr-3 text-xs text-slate-200 outline-none focus:border-indigo-500" />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-2">
                Recent Conversations
              </div>

              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No conversation history yet. Start a new chat!
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => loadConversationMessages(c.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors ${
                      activeConversationId === c.id
                        ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-200'
                        : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <MessageSquare className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-indigo-400" />
                      <span className="truncate">{c.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      title="Delete Thread"
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                pgvector RAG Active
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                Grounding v1.0
              </span>
            </div>
          </aside>

          {/* Main Chat Conversation Portal */}
          <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950">
            {/* Chat Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto text-center py-12">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-lg shadow-indigo-500/10">
                    <Bot className="h-8 w-8" />
                  </div>

                  <div className="max-w-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">CollegeGPT</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl">
                      Your official college knowledge assistant.
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-slate-400 sm:text-base">
                      Ask about attendance, academic policies, outcomes, learning activities, and other official college information. Answers are grounded in uploaded college documents.
                    </p>
                  </div>

                  <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                    {SUGGESTED_QUERIES.map((query, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setInputText(query)}
                        className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 text-left text-sm text-slate-300 transition-colors hover:border-indigo-500/40 hover:bg-slate-800/80 hover:text-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                        <span className="leading-6">{query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isAssistant = msg.sender === 'assistant';
                  const isUser = msg.sender === 'user';

                  return (
                    <div
                      key={msg.id || index}
                      className={`flex items-start gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {isAssistant && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-sm">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`w-full max-w-[820px] ${isUser ? 'ml-10' : 'mr-10'} ${isUser ? 'rounded-2xl bg-indigo-600/95 px-4 py-3 text-white shadow-lg shadow-indigo-900/20 sm:px-4 sm:py-3' : 'rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-slate-100 shadow-sm backdrop-blur-md sm:px-4 sm:py-4'}`}
                      >
                        {isAssistant ? (
                          <div className="space-y-3">
                            <AnswerRenderer content={msg.content} />

                            <div className="flex items-center gap-2 border-t border-slate-800/80 pt-2">
                              <button
                                type="button"
                                onClick={() => copyAnswer(msg.content, msg.id || index)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                                title="Copy response"
                                aria-label="Copy response"
                              >
                                {copiedMessage === (msg.id || index) ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                                {copiedMessage === (msg.id || index) ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm leading-7 whitespace-pre-wrap break-words text-slate-50">
                            {msg.content}
                          </div>
                        )}

                        {isAssistant && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-slate-950/60 p-3 shadow-inner shadow-slate-950/30">
                            <button
                              type="button"
                              onClick={() => setSourcesOpen((prev) => ({ ...prev, [msg.id || index]: !prev[msg.id || index] }))}
                              aria-expanded={Boolean(sourcesOpen[msg.id || index])}
                              className="flex w-full items-center justify-between gap-2 rounded-lg text-left transition-colors hover:text-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                            >
                              <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                </span>
                                <span>Grounded in official documents</span>
                              </span>
                              <span className="text-[11px] font-medium text-slate-300">
                                {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''}
                              </span>
                            </button>

                            {sourcesOpen[msg.id || index] && (
                              <div className="mt-3 grid gap-2">
                                {msg.sources.map((src, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() => setSelectedSource(src)}
                                    className="group w-full rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-left transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                                        <FileText className="h-4 w-4" />
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="min-w-0 flex-1">
                                            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                              Document
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-slate-100 break-words leading-5">
                                              {src.title}
                                            </div>
                                          </div>

                                          <span className="shrink-0 rounded-full border border-slate-700 bg-slate-950/80 px-2 py-1 text-[10px] font-medium text-indigo-200">
                                            Page {src.page || 1}
                                          </span>
                                        </div>

                                        {src.similarity !== undefined && src.similarity !== null && (
                                          <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-slate-400">
                                            Similarity <span className="ml-1 text-emerald-300">{String(src.similarity)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {error && !loading && (
                <div className="flex items-start gap-3.5">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div className="max-w-[820px] rounded-2xl border border-rose-500/20 bg-slate-900/80 px-4 py-3 text-slate-100 shadow-sm">
                    <div className="text-sm font-medium text-rose-200">We couldn’t load that answer.</div>
                    <p className="mt-1 text-sm text-slate-300">{error}</p>
                    <button
                      type="button"
                      onClick={handleRetryQuestion}
                      className="mt-3 inline-flex items-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-100 transition-colors hover:bg-rose-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex items-start gap-3.5">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">CollegeGPT is thinking</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400 [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400 [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
              <form
                onSubmit={handleSendMessage}
                className="mx-auto flex max-w-4xl items-end gap-3"
              >
                <textarea
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your college documents..."
                  aria-label="Message input"
                  className="flex-1 resize-none rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-h-32 custom-scrollbar shadow-inner"
                />

                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  aria-label="Send message"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="text-center mt-2 text-[11px] text-slate-500">
                Responses are strictly grounded in official college documents with page citations.
              </div>
            </div>
          </main>
        </div>

        {/* Source Citation Modal */}
        {selectedSource && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <BookOpen className="w-4 h-4" />
                  Citation Reference Inspector
                </div>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs px-2 py-1 rounded-lg bg-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Document</div>
                  <div className="mt-2 text-sm font-semibold text-slate-100 break-words leading-6">{selectedSource.title}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Page</div>
                    <div className="mt-2 text-sm font-medium text-indigo-200">{selectedSource.page || 1}</div>
                  </div>

                  {selectedSource.similarity !== undefined && selectedSource.similarity !== null && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Similarity</div>
                      <div className="mt-2 text-sm font-medium text-emerald-300">{String(selectedSource.similarity)}</div>
                    </div>
                  )}
                </div>

                {selectedSource.snippet && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2">Relevant passage</div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs leading-6 text-slate-300 italic break-words">
                      “{selectedSource.snippet}”
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
