import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AppShell from '../components/AppShell/AppShell';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import {
  MessageSquare,
  FileText,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  Building,
  GraduationCap,
  Clock,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [healthInfo, setHealthInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [docsRes, convsRes, healthRes] = await Promise.allSettled([
          api.get('/documents'),
          api.get('/conversations'),
          api.get('/health'),
        ]);

        if (docsRes.status === 'fulfilled' && docsRes.value.data?.data) {
          const docData = docsRes.value.data.data;
          if (Array.isArray(docData)) {
            setDocuments(docData);
          } else if (Array.isArray(docData.documents)) {
            setDocuments(docData.documents);
          } else {
            setDocuments([]);
          }
        }

        if (convsRes.status === 'fulfilled' && convsRes.value.data?.data) {
          const convData = convsRes.value.data.data;
          if (Array.isArray(convData)) {
            setConversations(convData);
          } else if (Array.isArray(convData.conversations)) {
            setConversations(convData.conversations);
          } else {
            setConversations([]);
          }
        }

        if (healthRes.status === 'fulfilled' && healthRes.value.data) {
          setHealthInfo(healthRes.value.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const safeDocs = Array.isArray(documents) ? documents : [];
  const safeConvs = Array.isArray(conversations) ? conversations : [];

  const indexedDocs = safeDocs.filter((d) => d && d.status === 'INDEXED');
  const totalChunks = indexedDocs.reduce((acc, d) => acc + (d.total_chunks || 0), 0);

  const quickPrompts = [
    'What is the minimum attendance requirement for semester exams?',
    'What are the passing CGPA requirements for graduation?',
    'How do I apply for a medical leave or condonation?',
    'What are the course registration deadlines and prerequisites?',
  ];

  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard | CollegeGPT</title>
      </Head>

      <AppShell>
        <div className="space-y-6">
          {/* Top Banner / Welcome */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Welcome back, {user?.name || 'Student'}
                </h1>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 capitalize">
                  {user?.role || 'Student'} • {user?.department || 'General'}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                Official College Knowledge Base & AI-Powered Academic Assistant.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition"
              >
                <MessageSquare className="h-4 w-4" />
                Ask CollegeGPT
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => router.push('/admin/documents')}
                  className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                >
                  <FileText className="h-4 w-4 text-indigo-400" />
                  Manage Documents
                </button>
              )}
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Indexed Knowledge</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{indexedDocs.length}</p>
              <p className="mt-1 text-xs text-slate-500">Official college documents</p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Vector Embeddings</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{totalChunks}</p>
              <p className="mt-1 text-xs text-slate-500">768-dim pgvector chunks</p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Consultations</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{safeConvs.length}</p>
              <p className="mt-1 text-xs text-slate-500">Saved student chats</p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">RAG Engine Status</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-lg font-bold text-emerald-400">Operational</p>
              <p className="mt-1 text-xs text-slate-500">Grounded & Verified citations</p>
            </div>
          </div>

          {/* Quick Inquiry / Prompts Section */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Ask Common Academic Questions</h3>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push('/')}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-left text-xs font-medium text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-950/20 hover:text-white transition group"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 flex-shrink-0 transition" />
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Knowledge Documents & Recent Consultations */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Active College Knowledge Base */}
            <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                  <h3 className="font-semibold text-white">College Knowledge Base</h3>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin/documents')}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Manage <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3">
                {safeDocs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No documents ingested yet. Administrators can upload handbooks and policies in Knowledge Ingestion.
                  </div>
                ) : (
                  safeDocs.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3 hover:border-slate-700 transition"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-slate-200 truncate">{doc.title}</p>
                        <p className="text-xs text-slate-500">
                          {doc.department || 'General'} • {doc.total_chunks || 0} chunks
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          doc.status === 'INDEXED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Conversations */}
            <div className="rounded-2xl border border-slate-800/80 bg-[#0d131f] p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  <h3 className="font-semibold text-white">Recent Inquiries</h3>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Start New <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {safeConvs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No recent inquiries. Click "Ask CollegeGPT" above to start your first consultation.
                  </div>
                ) : (
                  safeConvs.slice(0, 5).map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => router.push(`/?conversationId=${conv.id}`)}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3 hover:border-slate-700 hover:bg-slate-900 transition"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-slate-200 truncate">{conv.title}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(conv.updated_at || conv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
