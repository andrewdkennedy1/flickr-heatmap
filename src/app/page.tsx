'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityData } from '@/lib/flickr';
import { Heatmap } from '@/components/Heatmap';
import {
  AlertCircle,
  Calendar,
  Camera,
  Flame,
  Globe2,
  Info,
  LogIn,
  LogOut,
  MapPinned,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const currentYear = new Date().getFullYear();
  const [username, setUsername] = useState('yoshislens');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<ActivityData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUsername, setAuthenticatedUsername] = useState<string | null>(null);

  const popularUsers = ['nasahqphoto', 'nasamarshall', 'nasa2explore'];
  const yearOptions = Array.from({ length: currentYear - 2004 + 1 }, (_, index) => currentYear - index);

  const fillYearData = (input: ActivityData[], year: number) => {
    const byDate = new Map(input.map((entry) => [entry.date, entry]));
    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const end =
      year === currentYear
        ? new Date()
        : new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0) - 1);
    const days: ActivityData[] = [];

    for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const dateStr = cursor.toISOString().split('T')[0];
      const existing = byDate.get(dateStr);
      days.push(existing ?? { date: dateStr, count: 0, level: 0 });
    }

    return days;
  };

  const aggregatePhotos = (photos: Array<{ dateupload: string }>): ActivityData[] => {
    const counts: Record<string, number> = {};

    photos.forEach((photo) => {
      const date = new Date(Number.parseInt(photo.dateupload, 10) * 1000);
      const dateStr = date.toISOString().split('T')[0];
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts), 0);

    return Object.entries(counts).map(([date, count]) => {
      let level = 0;
      if (count > 0) {
        if (maxCount === 1) level = 2;
        else {
          const ratio = count / maxCount;
          if (ratio <= 0.25) level = 1;
          else if (ratio <= 0.5) level = 2;
          else if (ratio <= 0.75) level = 3;
          else level = 4;
        }
      }

      return { date, count, level };
    });
  };

  useEffect(() => {
    setMounted(true);
    const flickrUsername = document.cookie
      .split('; ')
      .find((row) => row.startsWith('flickr_username='))
      ?.split('=')[1];

    const flickrNsid = document.cookie
      .split('; ')
      .find((row) => row.startsWith('flickr_user_nsid='));

    if (flickrNsid) {
      setIsAuthenticated(true);
      if (flickrUsername) {
        const decoded = decodeURIComponent(flickrUsername);
        setAuthenticatedUsername(decoded);
        setUsername(decoded);
      }
    }
  }, []);

  const stats = useMemo(() => {
    if (!data) {
      return {
        totalUploads: 0,
        activeDays: 0,
        peakCount: 0,
        peakDate: null as string | null,
        longestStreak: 0,
      };
    }

    const totalUploads = data.reduce((acc, curr) => acc + curr.count, 0);
    const activeDays = data.filter((d) => d.count > 0).length;
    const peakCount = Math.max(...data.map((d) => d.count));
    const peakDate = data.find((d) => d.count === peakCount)?.date ?? null;
    const longestStreak = data.reduce(
      (acc, entry) => {
        if (entry.count > 0) {
          const current = acc.current + 1;
          return { current, longest: Math.max(acc.longest, current) };
        }
        return { current: 0, longest: acc.longest };
      },
      { current: 0, longest: 0 }
    ).longest;

    return { totalUploads, activeDays, peakCount, peakDate, longestStreak };
  }, [data]);

  const handleFetch = async (e?: React.FormEvent, selectedUsername?: string) => {
    e?.preventDefault();
    const targetUsername = selectedUsername ?? username;
    if (!targetUsername) return;

    setLoading(true);
    setProgress(0);
    setError(null);
    setData(null);

    try {
      const perPage = 500;
      let page = 1;
      let totalPages = 1;
      const allPhotos: Array<{ dateupload: string }> = [];

      do {
        const response = await fetch(
          `/api/photos?username=${encodeURIComponent(targetUsername)}&year=${selectedYear}&page=${page}&perPage=${perPage}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch photos');
        }

        allPhotos.push(...(result.photos ?? []));
        totalPages = result.totalPages ?? 1;
        setProgress(Math.round((page / totalPages) * 100));
        page += 1;
      } while (page <= totalPages);

      const filledData = fillYearData(aggregatePhotos(allPhotos), selectedYear);
      if (allPhotos.length === 0) {
        setError(`No photo activity found for ${selectedYear}. Try a previous year.`);
      }
      setData(filledData);
      setUsername(targetUsername);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleLogin = () => {
    window.location.href = '/api/auth/login';
  };

  const handleLogout = () => {
    document.cookie = 'flickr_user_nsid=; path=/; max-age=0';
    document.cookie = 'flickr_username=; path=/; max-age=0';
    setIsAuthenticated(false);
    setAuthenticatedUsername(null);
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
    setSelectedYear(currentYear);
    setError(null);
  };

  const handleQuickSelect = (value: string) => {
    setUsername(value);
    handleFetch(undefined, value);
  };

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-6 py-10 md:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/30 to-blue-500/30 text-white shadow-lg shadow-emerald-500/20">
              <Sparkles />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-200/80">Flickr Heatmap</p>
              <p className="text-slate-400">Upload frequency, made visible.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            {isAuthenticated ? (
              <div className="flex items-center gap-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-emerald-100">
                <span className="text-xs uppercase tracking-wide">Logged in</span>
                <span className="font-semibold">{authenticatedUsername}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-white/10 px-3 py-1 text-white transition hover:bg-white/20"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <LogIn size={16} />
                Login with Flickr
              </button>
            )}
          </div>
        </div>

        <section className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                <Wand2 size={14} />
                Instant, privacy-aware insights
              </div>
              <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
                Discover when your photography <span className="text-emerald-300">thrives</span>.
              </h1>
              <p className="max-w-2xl text-lg text-slate-300">
                Pick a year and a Flickr username to generate a contribution-style calendar. Log in to include
                private uploads in the visualization.
              </p>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'Year-by-year coverage',
                  icon: <Calendar className="text-emerald-300" size={18} />,
                  description: 'Select a year to surface every streak, lull, and comeback.',
                },
                {
                  title: 'Secure by design',
                  icon: <ShieldCheck className="text-blue-300" size={18} />,
                  description: 'OAuth keeps your credentials safe. Only you can see private uploads when logged in.',
                },
                {
                  title: 'Global usernames',
                  icon: <Globe2 className="text-cyan-300" size={18} />,
                  description: 'Search any public Flickr user, from agencies to hobbyists.',
                },
                {
                  title: 'Shareable insights',
                  icon: <Info className="text-amber-200" size={18} />,
                  description: 'Export-ready heatmap for portfolios, retros, or creative planning.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 card-glow"
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                    {item.icon}
                    {item.title}
                  </div>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 p-8 shadow-2xl glass-surface"
          >
            <div className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />
            <div className="absolute -right-14 -bottom-14 h-36 w-36 rounded-full bg-sky-500/10 blur-3xl" aria-hidden />
            <form onSubmit={handleFetch} className="relative space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>Flickr username</span>
                  <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] font-semibold text-emerald-200">required</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="e.g. nasahqphoto"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Year</div>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-white focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Popular</div>
                  <div className="flex flex-wrap gap-2">
                    {popularUsers.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleQuickSelect(value)}
                        className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-400/40 hover:text-white"
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !username}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-4 py-4 text-center text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Generating…' : 'Generate heatmap'}
                </button>
                <button
                  type="button"
                  onClick={loadDemo}
                  className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm font-semibold text-slate-100 transition hover:border-emerald-400/40 hover:text-white"
                >
                  <Radar size={16} />
                  Demo data
                </button>
              </div>

              {loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Loading photos…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800/80" role="status" aria-live="polite">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  Only requests your data from Flickr—no storage, no ads.
                </div>
                <div className="flex items-center gap-2">
                  <MapPinned size={16} className="text-sky-300" />
                  Want private uploads included? Log in, then run your username.
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-800/60 bg-slate-950/50 p-6 md:grid-cols-2">
          {[
            {
              title: 'Why log in?',
              body: 'Authenticated sessions let us include your private uploads in the heatmap while keeping your data on Flickr.',
              icon: <ShieldCheck size={18} className="text-emerald-300" />,
            },
            {
              title: 'What counts as an upload?',
              body: 'Every photo upload is counted on the day it was posted for the selected year.',
              icon: <Camera size={18} className="text-sky-300" />,
            },
            {
              title: 'Share or embed',
              body: 'Download a screenshot or embed the heatmap in retrospectives to highlight your creative streaks.',
              icon: <Info size={18} className="text-amber-200" />,
            },
            {
              title: 'Try popular users',
              body: 'Unsure where to start? nasahqphoto, nasamarshall, and nasa2explore make great demos.',
              icon: <Globe2 size={18} className="text-cyan-200" />,
            },
          ].map((card) => (
            <div key={card.title} className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-5 card-glow">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                {card.icon}
                {card.title}
              </div>
              <p className="text-sm text-slate-400">{card.body}</p>
            </div>
          ))}
        </section>

        <AnimatePresence mode="wait">
          {data ? (
            <motion.div
              key="heatmap-container"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Calendar size={18} />
                    <span className="text-xs uppercase tracking-[0.2em]">Total uploads</span>
                  </div>
                  <div className="text-4xl font-black text-emerald-300">{stats.totalUploads.toLocaleString()}</div>
                  <p className="mt-2 text-xs text-slate-500">In {selectedYear}.</p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Info size={18} />
                    <span className="text-xs uppercase tracking-[0.2em]">Active days</span>
                  </div>
                  <div className="text-4xl font-black text-blue-300">{stats.activeDays}</div>
                  <p className="mt-2 text-xs text-slate-500">Days with one or more uploads.</p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Camera size={18} />
                    <span className="text-xs uppercase tracking-[0.2em]">Peak day</span>
                  </div>
                  <div className="text-4xl font-black text-teal-200">{stats.peakCount}</div>
                  <p className="mt-2 text-xs text-slate-500">
                    {stats.peakDate ? `Highest uploads on ${stats.peakDate}` : 'Run a search to see your peak day.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5">
                  <div className="mb-2 flex items-center gap-2 text-slate-400">
                    <Flame size={18} />
                    <span className="text-xs uppercase tracking-[0.2em]">Longest streak</span>
                  </div>
                  <div className="text-4xl font-black text-amber-300">{stats.longestStreak}</div>
                  <p className="mt-2 text-xs text-slate-500">Consecutive days with uploads.</p>
                </div>
              </div>

              <Heatmap data={data} username={username} yearLabel={selectedYear.toString()} />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-4 rounded-3xl border border-dashed border-slate-800/70 bg-slate-900/40 p-8 text-center"
            >
              <p className="mx-auto max-w-2xl text-lg text-slate-300">
                Paste a Flickr username to generate a contribution-style heatmap. Try the demo data to see how it
                works without signing in.
              </p>
              <div className="mx-auto flex flex-wrap items-center justify-center gap-3 text-sm text-slate-400">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <Sparkles size={16} className="text-emerald-300" />
                  Visualize a full year instantly
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <Radar size={16} className="text-sky-300" />
                  Highlight streaks and quiet periods
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <ShieldCheck size={16} className="text-emerald-200" />
                  Keep your data on Flickr
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="relative z-10 border-t border-slate-900/60 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Flickr Heatmap — built for photographers who love data.</p>
      </footer>
    </main>
  );
}
