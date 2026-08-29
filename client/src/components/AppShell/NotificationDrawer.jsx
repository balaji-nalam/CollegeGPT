import { useEffect, useState } from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, XCircle, Info, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { subscribeToUserNotifications } from '../../services/socket';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data?.data) {
        setNotifications(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Subscribe to real-time notification socket events
  useEffect(() => {
    if (!user?.id && !user?._id) return;
    const uid = user.id || user._id;
    const unsub = subscribeToUserNotifications(uid, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => unsub();
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case 'failure':
        return <XCircle className="h-5 w-5 text-rose-400" />;
      case 'escalation':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      default:
        return <Info className="h-5 w-5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[#0d131f] border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#090d16]">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-slate-100">Live Notifications</h2>
              <span className="ml-2 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                {notifications.filter((n) => !n.isRead).length} Unread
              </span>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-slate-400 hover:text-indigo-400 transition"
                  title="Mark all as read"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex h-32 items-center justify-center text-slate-500 text-sm">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-sm">
                <Bell className="h-10 w-10 stroke-[1.5] mb-2 opacity-30" />
                <p>No notifications yet</p>
                <p className="text-xs text-slate-600 mt-1">Execution alerts and agent escalations will appear here</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id || notif.id || Math.random()}
                  className={`p-3.5 rounded-xl border transition-all ${
                    notif.isRead
                      ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                      : 'bg-slate-900/90 border-slate-700 text-slate-200 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getTypeIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-100 truncate">{notif.title}</h4>
                        <span className="text-[10px] text-slate-500">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
