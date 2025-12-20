'use client';

import React, { useState, useEffect } from 'react';
import { ActivityData } from '@/lib/flickr';
import { Heatmap } from '@/components/Heatmap';
import { Search, Loader2, Info, Camera, Calendar, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [username, setUsername] = useState('yoshislens');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ActivityData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUsername, setAuthenticatedUsername] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Check for auth cookies (only non-httpOnly ones are readable)
    const flickrUsername = document.cookie
      .split('; ')
      .find(row => row.startsWith('flickr_username='))
      ?.split('=')[1];

    const flickrNsid = document.cookie
      .split('; ')
      .find(row => row.startsWith('flickr_user_nsid='));

    if (flickrNsid) {
      setIsAuthenticated(true);
      if (flickrUsername) {
        const decoded = decodeURIComponent(flickrUsername);
        setAuthenticatedUsername(decoded);
        setUsername(decoded);
      }
    }
  }, []);

  const handleFetch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!username) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Use API endpoint which handles OAuth server-side
      const response = await fetch(`/api/photos?username=${encodeURIComponent(username)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch photos');
      }

      if (result.data.length === 0) {
        setError('No photo activity found for this user in the last year.');
      } else {
        setData(result.data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleLogout = () => {
    // Clear cookies
    document.cookie = 'flickr_user_nsid=; path=/; max-age=0';
    document.cookie = 'flickr_username=; path=/; max-age=0';
    setIsAuthenticated(false);
    setAuthenticatedUsername(null);
    // Reload to clear httpOnly cookies via redirect
    window.location.href = '/';
  };

  const loadDemo = () => {
    const demoData: ActivityData[] = [];
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0;
      let level = 0;
      if (count > 0) {
        if (count < 3) level = 1;
        else if (count < 5) level = 2;
        else if (count < 8) level = 3;
        else level = 4;
      }
      demoData.push({ date: dateStr, count, level });
    }
    setData(demoData.sort((a, b) => a.date.localeCompare(b.date)));
    setUsername('DemoUser');
    setError(null);
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-emerald-500/30">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Auth Status Bar */}
        <div className="flex justify-end mb-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-emerald-400">
                ✓ Logged in as {authenticatedUsername}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-xl transition-all"
            >
              <LogIn size={16} />
              Login with Flickr
            </button>
          )}
        </div>

        {/* Header */}
        <header className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6"
          >
            <Camera size={14} />
            <span>Flickr Insights</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent"
          >
            Upload Heatmap
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            Visualize your Flickr photo activity with a GitHub-style contribution calendar.
            {!isAuthenticated && ' Login to see your private photos too.'}
          </motion.p>
        </header>

        {/* Search Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl mb-12"
        >
          <form onSubmit={handleFetch} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Flickr Username</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="e.g. nasa-goddard"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !username}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Generate Heatmap'}
              </button>
              <button
                type="button"
                onClick={loadDemo}
                className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-2xl transition-all active:scale-95"
              >
                Demo
              </button>
            </div>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {data && (
            <motion.div
              key="heatmap-container"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-12"
            >
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <Calendar size={18} />
                    <span className="text-sm font-medium">Total Uploads</span>
                  </div>
                  <div className="text-4xl font-black text-emerald-400">
                    {data.reduce((acc, curr) => acc + curr.count, 0)}
                  </div>
                </div>
                <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <Info size={18} />
                    <span className="text-sm font-medium">Active Days</span>
                  </div>
                  <div className="text-4xl font-black text-blue-400">
                    {data.filter(d => d.count > 0).length}
                  </div>
                </div>
                <div className="flex-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-6 rounded-3xl">
                  <div className="flex items-center gap-3 text-slate-400 mb-2">
                    <Camera size={18} />
                    <span className="text-sm font-medium">Peak Day</span>
                  </div>
                  <div className="text-4xl font-black text-teal-400">
                    {Math.max(...data.map(d => d.count))}
                  </div>
                </div>
              </div>

              <Heatmap data={data} username={username} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-12 text-center text-slate-600 text-sm border-t border-slate-900">
        <p>© {new Date().getFullYear()} Flickr Heatmap. Made with React & Flickr API.</p>
      </footer>
    </main>
  );
}
