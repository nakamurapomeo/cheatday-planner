import React, { useState } from 'react';
import { Lock, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export default function Login({ onLogin }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                onLogin();
            } else {
                setError(data.error || 'ログインに失敗しました');
            }
        } catch {
            setError('サーバーに接続できません');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-sm relative z-10 animate-fadeIn">
                <div className="card-enhanced rounded-3xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative w-20 h-20 mx-auto mb-5">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 animate-pulse opacity-50 blur-lg" />
                            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                                <span className="text-4xl">🍕</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold gradient-text mb-2">チートデイプランナー</h1>
                        <p className="text-white/50 text-sm">パスワードを入力してログイン</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-pink-500/20 blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden group-focus-within:border-orange-500/50 transition-colors">
                                <div className="pl-4 pr-2">
                                    <Lock size={18} className="text-white/40" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="パスワード"
                                    className="w-full bg-transparent px-2 py-4 text-white placeholder-white/40 outline-none"
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fadeIn">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password.trim()}
                            className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={22} className="animate-spin" />
                                    ログイン中...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    ログイン
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer hint */}
                    <p className="text-center text-white/30 text-xs mt-6">
                        美味しい1日を計画しましょう 🍔🍰🍜
                    </p>
                </div>
            </div>
        </div>
    );
}
