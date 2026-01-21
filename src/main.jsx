import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import Login from './Login.jsx';
import { Loader2, LogOut, Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';

function AuthWrapper() {
  const [authState, setAuthState] = useState('loading');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSynced, setLastSynced] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/verify');
      const data = await res.json();
      setAuthState(data.authenticated ? 'authenticated' : 'unauthenticated');
    } catch {
      setAuthState('authenticated');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = useCallback(() => {
    setAuthState('authenticated');
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    setAuthState('unauthenticated');
  }, []);

  const loadData = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/data');
      if (res.status === 401) {
        setAuthState('unauthenticated');
        return null;
      }
      const json = await res.json();
      if (json.data) {
        setSyncStatus('synced');
        setLastSynced(new Date());
        return json.data;
      }
      setSyncStatus('idle');
      return null;
    } catch {
      setSyncStatus('error');
      return null;
    }
  }, []);

  const saveData = useCallback(async (data) => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (res.status === 401) {
        setAuthState('unauthenticated');
        return false;
      }
      if (res.ok) {
        setSyncStatus('synced');
        setLastSynced(new Date());
        return true;
      }
      setSyncStatus('error');
      return false;
    } catch {
      setSyncStatus('error');
      return false;
    }
  }, []);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-lg animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
          </div>
          <p className="text-white/50 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Login onLogin={handleLogin} />;
  }

  const SyncIcon = syncStatus === 'syncing' ? RefreshCw :
    syncStatus === 'synced' ? Check :
      syncStatus === 'error' ? CloudOff : Cloud;

  const syncColor = syncStatus === 'syncing' ? 'text-orange-400' :
    syncStatus === 'synced' ? 'text-emerald-400' :
      syncStatus === 'error' ? 'text-red-400' : 'text-white/40';

  const syncText = syncStatus === 'syncing' ? '同期中...' :
    syncStatus === 'synced' ? `保存済み` :
      syncStatus === 'error' ? '同期エラー' : 'ローカル';

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Main app - No padding needed now */}
      <div className="h-full">
        <App loadData={loadData} saveData={saveData} />
      </div>

      {/* Enhanced Sync Status Bar - Floating Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
        <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur text-white px-3 py-2 rounded-full shadow-lg border border-white/10">
          <div className={`p-1 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500/20' : syncStatus === 'error' ? 'bg-red-500/20' : 'bg-white/10'}`}>
            <SyncIcon size={12} className={`${syncColor} ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-xs font-medium pr-1">
            {syncText}
          </span>
          {syncStatus === 'synced' && lastSynced && (
            <span className="text-[10px] text-white/40 border-l border-white/20 pl-2">
              {lastSynced.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className="w-px h-3 bg-white/20 mx-1"></div>
          <button
            onClick={handleLogout}
            className="text-white/50 hover:text-white transition-colors"
            title="ログアウト"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthWrapper />
  </React.StrictMode>
);
