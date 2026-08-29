import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AppShell from '../../components/AppShell/AppShell';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  FileText,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  BarChart3,
  XCircle,
  Database,
  Building,
} from 'lucide-react';

export default function AdminDocumentsPage() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Academics');
  const [department, setDepartment] = useState('Computer Science');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [documentType, setDocumentType] = useState('Handbook');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents', {
        params: {
          search: search || undefined,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          department: departmentFilter || undefined,
        },
      });
      setDocuments(res.data?.data?.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter, statusFilter, departmentFilter]);

  // Polling for processing documents
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000);

    return () => clearInterval(interval);
  }, [documents]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a PDF or text document to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccessMsg(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('department', department);
      formData.append('academic_year', academicYear);
      formData.append('document_type', documentType);

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMsg(`Document "${title}" uploaded and queued for vector indexing.`);
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';

      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleReprocess = async (docId, docTitle) => {
    try {
      setError(null);
      await api.post(`/documents/${docId}/reprocess`);
      setSuccessMsg(`Reprocessing initiated for "${docTitle}"`);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reprocess document');
    }
  };

  const handleDelete = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${docTitle}" and its vector chunks?`)) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/documents/${docId}`);
      setSuccessMsg(`Deleted "${docTitle}" successfully`);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  // Compute Stats
  const totalCount = documents.length;
  const indexedCount = documents.filter((d) => d.status === 'INDEXED').length;
  const processingCount = documents.filter((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED').length;
  const failedCount = documents.filter((d) => d.status === 'FAILED').length;
  const totalChunks = documents.reduce((sum, d) => sum + (d.total_chunks || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'INDEXED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            INDEXED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            PROCESSING
          </span>
        );
      case 'UPLOADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" />
            UPLOADED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <Head>
          <title>Document Knowledge Ingestion | CollegeGPT Admin</title>
        </Head>

        <div className="p-6 max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
                    Document Ingestion & Knowledge Base
                  </h1>
                  <p className="text-sm text-slate-400">
                    Upload official academic handbooks, syllabi, and guidelines for pgvector chunking and embedding.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={fetchDocuments}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Metric Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Total Documents</span>
                <FileText className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100 mt-2">{totalCount}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Indexed (Ready)</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 mt-2">{indexedCount}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Active Vector Chunks</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-indigo-300 mt-2">{totalChunks}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
                <span>Processing / Failed</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-slate-200 mt-2">
                {processingCount} <span className="text-sm font-normal text-slate-500">/</span> <span className="text-rose-400">{failedCount}</span>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Upload Card */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              Ingest New College Document
            </h2>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Academic Regulations Handbook 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Academics">Academics</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Examination">Examination</option>
                    <option value="Fee Policies">Fee Policies</option>
                    <option value="Hostel & Campus">Hostel & Campus</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science, Academic Affairs"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    placeholder="2025-2026"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Document Type
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Handbook">Handbook</option>
                    <option value="Syllabus">Syllabus</option>
                    <option value="Policy Document">Policy Document</option>
                    <option value="Admission Circular">Admission Circular</option>
                    <option value="Fee Schedule">Fee Schedule</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select File (.pdf, .txt) *
                  </label>
                  <input
                    id="doc-file-input"
                    type="file"
                    required
                    accept=".pdf,.txt"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of document scope and contents..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Uploading & Ingesting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Ingest Document
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search title/description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDocuments()}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="Academics">Academics</option>
                <option value="Admissions">Admissions</option>
                <option value="Examination">Examination</option>
                <option value="Fee Policies">Fee Policies</option>
                <option value="Hostel & Campus">Hostel & Campus</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Academic Affairs">Academic Affairs</option>
                <option value="Administration">Administration</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="INDEXED">INDEXED</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="FAILED">FAILED</option>
                <option value="UPLOADED">UPLOADED</option>
              </select>
            </div>
          </div>

          {/* Document Table */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Category & Dept</th>
                    <th className="px-6 py-4">Pages / Chunks</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Uploaded</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        {loading ? 'Loading documents...' : 'No documents matching criteria.'}
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-200">{doc.title}</div>
                              <div className="text-xs text-slate-500">
                                {doc.filename} &bull; {(doc.file_size / 1024).toFixed(1)} KB
                              </div>
                              {doc.error_message && (
                                <div className="text-xs text-rose-400 mt-1 max-w-md truncate">
                                  Failure Reason: {doc.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-slate-300 font-medium">{doc.category}</div>
                          <div className="text-xs text-slate-500">{doc.department}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <span>{doc.total_pages || 1} pages</span>
                            <span>&bull;</span>
                            <span className="font-semibold text-indigo-300">{doc.total_chunks || 0} chunks</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>

                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleReprocess(doc.id, doc.title)}
                              title="Reprocess Document"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDelete(doc.id, doc.title)}
                              title="Delete Document & Chunks"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
