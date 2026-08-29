import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AppShell from '../components/AppShell/AppShell';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
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
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  'What is the minimum attendance requirement?',
  'How does the grading and CGPA scale work?',
  'What is the refund policy for withdrawn admission?',
  'What are the condonation rules for medical absence?',
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

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading) return;

    const question = inputText.trim();
    setInputText('');

    // Optimistically add user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: question,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
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
      const errorMsg = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: err.response?.data?.message || 'Sorry, an error occurred while querying the knowledge base.',
        is_fallback: true,
        sources: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 py-2">
                Recent Conversations
              </div>

              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No conversation history yet. Start a new chat!
                </div>
              ) : (
                conversations.map((c) => (
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
                <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6 py-12">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-2xl shadow-indigo-500/10">
                    <Bot className="w-10 h-10" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
                      Welcome to CollegeGPT
                    </h2>
                    <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                      Your official college assistant. Ask any question regarding academic syllabi, grading policies, attendance regulations, or fee structures.
                    </p>
                  </div>

                  {/* Suggested Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                    {SUGGESTED_QUERIES.map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputText(query);
                        }}
                        className="flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-left text-xs text-slate-300 hover:text-indigo-200 hover:border-indigo-500/40 transition-all shadow-sm group"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span>{query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex items-start gap-3.5 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'assistant' && (
                      <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex-shrink-0 mt-0.5">
                        <Bot className="w-5 h-5" />
                      </div>
                    )}

                    <div
                      className={`max-w-2xl rounded-2xl p-4 shadow-md ${
                        msg.sender === 'user'
                          ? 'bg-indigo-600 text-white ml-12 rounded-tr-sm'
                          : 'bg-slate-900/80 border border-slate-800/80 text-slate-200 mr-12 rounded-tl-sm backdrop-blur-md'
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {/* Source References Badges */}
                      {msg.sender === 'assistant' && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            Grounded Sources ({msg.sources.length}):
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map((src, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => setSelectedSource(src)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 text-xs text-indigo-300 transition-colors"
                              >
                                <span className="font-medium truncate max-w-[200px]">
                                  {src.title}
                                </span>
                                <span className="text-slate-500">&bull;</span>
                                <span className="font-mono text-slate-400">P. {src.page || 1}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex-shrink-0 mt-0.5">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex items-start gap-3.5">
                  <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="rounded-2xl p-4 bg-slate-900/80 border border-slate-800/80 text-slate-400 rounded-tl-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                    <span className="text-xs font-medium text-slate-400">
                      Searching knowledge base and formulating grounded response...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
              <form
                onSubmit={handleSendMessage}
                className="max-w-4xl mx-auto flex items-center gap-3 relative"
              >
                <textarea
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about college guidelines, attendance, fees, syllabus... (Press Enter)"
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none max-h-32 custom-scrollbar shadow-inner"
                />

                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
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

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Source Document:</div>
                  <div className="text-sm font-semibold text-slate-200">{selectedSource.title}</div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Page: <strong className="text-indigo-300">{selectedSource.page || 1}</strong></span>
                  <span>Similarity: <strong className="text-emerald-400">{selectedSource.similarity || 'N/A'}</strong></span>
                </div>

                {selectedSource.snippet && (
                  <div>
                    <div className="text-xs text-slate-400 font-medium mb-1">Source Snippet:</div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic leading-relaxed">
                      "{selectedSource.snippet}..."
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
