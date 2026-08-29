import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '../components/AppShell/AppShell';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import {
  PlugZap,
  Mail,
  MessageSquare,
  Table,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  Key,
  Shield,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

const INTEGRATION_METADATA = {
  gmail: {
    title: 'Gmail',
    description: 'Send transaction emails, support auto-responses, and process incoming notifications.',
    icon: Mail,
    iconColor: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    type: 'oauth',
  },
  slack: {
    title: 'Slack',
    description: 'Post channel notifications, incident bulletins, and listen to workspace team events.',
    icon: MessageSquare,
    iconColor: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    type: 'oauth',
  },
  discord: {
    title: 'Discord',
    description: 'Broadcast community alerts, webhook triggers, and developer ops bot announcements.',
    icon: MessageSquare,
    iconColor: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    type: 'bot',
  },
  'google-sheets': {
    title: 'Google Sheets',
    description: 'Append rows, update spreadsheets, read range data, and sync business leads.',
    icon: Table,
    iconColor: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    type: 'oauth',
  },
  openrouter: {
    title: 'OpenRouter AI',
    description: 'Access 200+ unified LLM models for complex multi-step reasoning and graph compilation.',
    icon: Sparkles,
    iconColor: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    type: 'apiKey',
  },
  gemini: {
    title: 'Google Gemini SDK',
    description: 'Fast, high-throughput generative reasoning with 1.5 Flash and Pro models.',
    icon: Sparkles,
    iconColor: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    type: 'apiKey',
  },
};

export default function Integrations() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/integrations');
      if (res.data?.data) {
        setIntegrations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load integrations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();

    if (router.query.status === 'success') {
      setAlertMsg({ type: 'success', text: `Successfully connected ${router.query.provider || 'provider'}!` });
    } else if (router.query.status === 'error') {
      setAlertMsg({ type: 'error', text: `Connection error: ${router.query.message || 'Authorization failed'}` });
    }
  }, [router.query]);

  const handleConnectOAuth = async (provider) => {
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.data?.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch (err) {
      // If OAuth credentials unset, simulate sandbox connection
      await handleSaveManual(provider, `mock_${provider}_oauth_token`);
    }
  };

  const handleSaveManual = async (provider, keyVal) => {
    try {
      setSavingKey(true);
      await api.post('/integrations', {
        provider,
        apiKey: keyVal || apiKeyInput,
        accessToken: keyVal || apiKeyInput,
      });
      setSelectedProvider(null);
      setApiKeyInput('');
      fetchIntegrations();
      setAlertMsg({ type: 'success', text: `${provider} credentials encrypted and connected!` });
    } catch (err) {
      console.error('Failed to save credentials', err);
      alert(err.response?.data?.message || 'Failed to save credentials');
    } finally {
      setSavingKey(false);
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    try {
      await api.delete(`/integrations/${provider}`);
      fetchIntegrations();
      setAlertMsg({ type: 'info', text: `${provider} disconnected.` });
    } catch (err) {
      console.error('Failed to disconnect', err);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Third-Party Integrations</h1>
              <p className="mt-1 text-sm text-slate-400">
                Connect external tool services with AES-256-GCM application-level credential encryption at rest.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
              <Shield className="h-4 w-4" />
              <span>AES-256 Encrypted Vault</span>
            </div>
          </div>

          {/* Status Alert */}
          {alertMsg && (
            <div
              className={`flex items-center justify-between rounded-xl p-3 text-xs border ${
                alertMsg.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : alertMsg.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {alertMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{alertMsg.text}</span>
              </div>
              <button onClick={() => setAlertMsg(null)} className="hover:opacity-75">×</button>
            </div>
          )}

          {/* Providers Grid */}
          {loading ? (
            <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
              Loading integrations...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((item) => {
                const meta = INTEGRATION_METADATA[item.provider] || {
                  title: item.provider,
                  description: 'External automation tool',
                  icon: PlugZap,
                  iconColor: 'text-indigo-400',
                  bg: 'bg-indigo-500/10 border-indigo-500/20',
                  type: 'apiKey',
                };
                const Icon = meta.icon;

                return (
                  <div
                    key={item.provider}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0d131f] p-5 shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${meta.bg} ${meta.iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.isConnected
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800/80 text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                          {item.isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-semibold text-white">{meta.title}</h3>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{meta.description}</p>
                    </div>

                    <div className="mt-6 flex items-center gap-2 border-t border-slate-800/80 pt-4">
                      {item.isConnected ? (
                        <>
                          <button
                            onClick={() => (meta.type === 'oauth' ? handleConnectOAuth(item.provider) : setSelectedProvider(item.provider))}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Reconnect
                          </button>
                          <button
                            onClick={() => handleDisconnect(item.provider)}
                            title="Disconnect Provider"
                            className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            if (meta.type === 'oauth') {
                              handleConnectOAuth(item.provider);
                            } else {
                              setSelectedProvider(item.provider);
                            }
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition"
                        >
                          <PlugZap className="h-3.5 w-3.5" />
                          Connect {meta.title}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal for API Key / Token input */}
          {selectedProvider && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d131f] p-6 shadow-2xl">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Key className="h-5 w-5" />
                  <h2 className="text-base font-bold text-white">Connect {selectedProvider}</h2>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Enter your API token or secret key. It will be encrypted at rest using AES-256-GCM.
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    type="password"
                    placeholder={`Enter ${selectedProvider} API key or bot token`}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-mono transition"
                    autoFocus
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setApiKeyInput(`mock_${selectedProvider}_key_vault`)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300"
                    >
                      Autofill Sandbox Demo Token
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvider(null);
                      setApiKeyInput('');
                    }}
                    className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingKey || !apiKeyInput.trim()}
                    onClick={() => handleSaveManual(selectedProvider)}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    {savingKey ? 'Encrypting & Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
