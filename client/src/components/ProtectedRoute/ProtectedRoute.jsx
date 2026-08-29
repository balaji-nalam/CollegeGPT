import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const router = useRouter();
  const { isAuthenticated, token, user, fetchProfile } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      if (!token) {
        if (isMounted) {
          setChecking(false);
          router.replace('/login');
        }
        return;
      }

      if (!user) {
        const fetched = await fetchProfile();
        if (!fetched && isMounted) {
          router.replace('/login');
          return;
        }
      }

      if (isMounted) {
        setChecking(false);
      }
    }

    verify();
    return () => {
      isMounted = false;
    };
  }, [token, user, router, fetchProfile]);

  if (checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#080c14] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm font-medium tracking-wide">Authenticating Operator Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#080c14] text-slate-300">
        <h2 className="text-xl font-bold text-rose-400">Access Denied</h2>
        <p className="mt-2 text-sm text-slate-400">Your role ({user.role}) does not have permission to view this page.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
}
