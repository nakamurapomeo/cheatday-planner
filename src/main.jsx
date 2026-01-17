import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import Login from './Login.jsx';
import { Loader2, LogOut, Cloud, CloudOff, RefreshCw } from 'lucide-react';

function AuthWrapper() {
  const [authState, setAuthState] = useState('loading'); // loading, authenticated, unauthenticated
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [lastSynced, setLastSynced] = useState(null);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/verify');
      const data = await res.json();
      setAuthState(data.authenticated ? 'authenticated' : 'unauthenticated');
    } catch (e) {
      // If API not available (local dev), skip auth
      setAuthState('authenticated');
    }
  };

  const handleLogin = () => {
    setAuthState('authenticated');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { }
    setAuthState('unauthenticated');
  };

  // Load data from KV
  const loadData = async () => {
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
    } catch (e) {
      setSyncStatus('error');
      return null;
    }
  };

  // Save data to KV
  const saveData = async (data) => {
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
    } catch (e) {
      setSyncStatus('error');
      return false;
    }
  };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 size={48} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="relative">
      {/* Sync status bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur border-b border-white/10">
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {syncStatus === 'syncing' ? (
              <RefreshCw size={14} className="text-orange-400 animate-spin" />
            ) : syncStatus === 'synced' ? (
              <Cloud size={14} className="text-emerald-400" />
            ) : syncStatus === 'error' ? (
              <CloudOff size={14} className="text-red-400" />
            ) : (
              <Cloud size={14} className="text-white/40" />
            )}
            <span className="text-white/60">
              {syncStatus === 'syncing' ? '同期中...' :
                syncStatus === 'synced' ? `同期済み ${lastSynced?.toLocaleTimeString('ja-JP')}` :
                  syncStatus === 'error' ? '同期エラー' : 'ローカル'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-white/60 hover:text-white/90 px-2 py-1 rounded hover:bg-white/10"
          >
            <LogOut size={14} />
            ログアウト
          </button>
        </div>
      </div>

      {/* Main app with padding for status bar */}
      <div className="pt-10">
        <App loadData={loadData} saveData={saveData} />
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthWrapper />
  </React.StrictMode>
);
