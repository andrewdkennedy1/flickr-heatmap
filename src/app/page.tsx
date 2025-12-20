'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ActivityData } from '@/lib/flickr';
import { Heatmap } from '@/components/Heatmap';
import { motion, AnimatePresence } from 'framer-motion';

const TAKEN_LABEL = 'photos taken';
const UPLOAD_LABEL = 'uploads';

type PhotoRecord = { dateupload: string; datetaken?: string };
type ActivityMode = 'taken' | 'upload';

export default function Home() {
  const currentYear = new Date().getFullYear();
  const [inputUsername, setInputUsername] = useState('');
  const [activeUsername, setActiveUsername] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeYear, setActiveYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<ActivityData[] | null>(null);
  const [uploadData, setUploadData] = useState<ActivityData[] | null>(null);
  const [activityMode, setActivityMode] = useState<ActivityMode>('taken');
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUsername, setAuthenticatedUsername] = useState<string | null>(null);

  const yearOptions = Array.from({ length: currentYear - 2004 + 1 }, (_, index) => currentYear - index);
  const activeData = activityMode === 'taken' ? data : uploadData;
  const activeLabel = activityMode === 'taken' ? TAKEN_LABEL : UPLOAD_LABEL;

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

  const aggregatePhotos = (photos: PhotoRecord[], mode: ActivityMode): ActivityData[] => {
    const counts: Record<string, number> = {};

    photos.forEach((photo) => {
      let dateStr = '';
      if (mode === 'taken') {
        if (photo.datetaken) {
          dateStr = photo.datetaken.split(' ')[0] ?? '';
        } else {
          const fallback = new Date(Number.parseInt(photo.dateupload, 10) * 1000);
          dateStr = fallback.toISOString().split('T')[0];
        }
      } else {
        const date = new Date(Number.parseInt(photo.dateupload, 10) * 1000);
        dateStr = date.toISOString().split('T')[0];
      }

      if (!dateStr) return;
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
        setInputUsername(decoded);
      }
    }
  }, []);

  const stats = useMemo(() => {
    if (!activeData) {
      return {
        totalPhotos: 0,
        activeDays: 0,
        peakCount: 0,
        peakDate: null as string | null,
        longestStreak: 0,
        busiestMonthLabel: '—',
      };
    }

    const totalPhotos = activeData.reduce((acc, curr) => acc + curr.count, 0);
    const activeDays = activeData.filter((day) => day.count > 0).length;
    const peakCount = Math.max(...activeData.map((day) => day.count));
    const peakDate =
      peakCount > 0 ? activeData.find((day) => day.count === peakCount)?.date ?? null : null;
    const longestStreak = activeData
      .reduce(
        (acc, entry) => {
          if (entry.count > 0) {
            const current = acc.current + 1;
            return { current, longest: Math.max(acc.longest, current) };
          }
          return { current: 0, longest: acc.longest };
        },
        { current: 0, longest: 0 }
      )
      .longest;

    const monthTotals = Array.from({ length: 12 }, () => 0);
    activeData.forEach((entry) => {
      const monthIndex = Number.parseInt(entry.date.slice(5, 7), 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthTotals[monthIndex] += entry.count;
      }
    });
    const busiestMonthIndex = monthTotals.reduce((best, value, index) => {
      if (value > monthTotals[best]) return index;
      return best;
    }, 0);
    const busiestMonthLabel =
      totalPhotos > 0
        ? new Date(Date.UTC(activeYear, busiestMonthIndex, 1)).toLocaleString('en-US', {
          month: 'short',
        })
        : '—';

    return { totalPhotos, activeDays, peakCount, peakDate, longestStreak, busiestMonthLabel };
  }, [activeData, activeYear]);

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

  const handleShare = () => {
    if (!activeData || !activeUsername) return;

    const canvas = document.createElement('canvas');
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.beginPath();
    ctx.arc(1030, 120, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.beginPath();
    ctx.arc(150, 520, 220, 0, Math.PI * 2);
    ctx.fill();

    const cardX = 70;
    const cardY = 70;
    const cardW = width - 140;
    const cardH = height - 140;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    drawRoundedRect(cardX, cardY, cardW, cardH, 28);
    ctx.fill();

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 2;
    drawRoundedRect(cardX, cardY, cardW, cardH, 28);
    ctx.stroke();

    const padding = 40;
    const innerX = cardX + padding;
    const innerY = cardY + padding;
    const innerW = cardW - padding * 2;
    const innerH = cardH - padding * 2;

    const displayName =
      activeUsername.length > 28 ? `${activeUsername.slice(0, 28)}...` : activeUsername;
    const summaryLabel = activityMode === 'taken' ? 'photo activity summary' : 'upload activity summary';

    ctx.fillStyle = '#d1fae5';
    ctx.font = 'bold 22px ui-sans-serif, system-ui';
    ctx.fillText('Flickr Heatmap', innerX, innerY + 18);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 44px ui-sans-serif, system-ui';
    ctx.fillText(`${displayName}'s ${activeLabel}`, innerX, innerY + 62);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px ui-sans-serif, system-ui';
    ctx.fillText(`${activeYear} ${summaryLabel}`, innerX, innerY + 94);

    const totalLabel = activityMode === 'taken' ? 'Total photos' : 'Total uploads';
    const statsList = [
      { label: totalLabel, value: stats.totalPhotos.toLocaleString(), color: '#34d399' },
      { label: 'Active days', value: stats.activeDays.toLocaleString(), color: '#7dd3fc' },
      { label: 'Peak count', value: stats.peakCount.toLocaleString(), color: '#fbbf24' },
      {
        label: 'Longest streak',
        value: stats.totalPhotos > 0 ? `${stats.longestStreak} days` : '—',
        color: '#5eead4',
      },
      { label: 'Busiest month', value: stats.busiestMonthLabel, color: '#fda4af' },
    ];

    const statTop = innerY + 130;
    const statHeight = 60;
    const statGap = 14;
    const statWidth = (innerW - statGap * 4) / 5;

    statsList.forEach((item, index) => {
      const x = innerX + index * (statWidth + statGap);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      drawRoundedRect(x, statTop, statWidth, statHeight, 12);
      ctx.fill();
      ctx.fillStyle = item.color;
      ctx.font = 'bold 26px ui-sans-serif, system-ui';
      ctx.fillText(item.value, x + 14, statTop + 30);
      ctx.fillStyle = '#cbd5f5';
      ctx.font = '12px ui-sans-serif, system-ui';
      ctx.fillText(item.label, x + 14, statTop + 50);
    });

    const heatmapTop = statTop + statHeight + 20;
    const heatmapHeight = innerY + innerH - heatmapTop - 32;
    const heatmapWidth = innerW;

    const heatmapColors = ['#0b1120', '#0e4429', '#047857', '#14b8a6', '#34d399'];
    const dateMap = new Map(activeData.map((entry) => [entry.date, entry.level]));
    const dayMs = 24 * 60 * 60 * 1000;
    const yearStart = new Date(Date.UTC(activeYear, 0, 1));
    const lastDate =
      activeData.length > 0
        ? new Date(`${activeData[activeData.length - 1].date}T00:00:00Z`)
        : new Date(Date.UTC(activeYear, 11, 31));
    const gridStart = new Date(yearStart);
    gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
    const gridEnd = new Date(lastDate);
    gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()));

    const totalDays = Math.floor((gridEnd.getTime() - gridStart.getTime()) / dayMs) + 1;
    const weeks = Math.ceil(totalDays / 7);
    const gap = 2;
    const blockSize = Math.max(6, Math.floor((heatmapWidth - gap * (weeks - 1)) / weeks));
    const gridWidth = weeks * blockSize + gap * (weeks - 1);
    const gridHeight = 7 * blockSize + gap * 6;
    const gridX = innerX + Math.floor((heatmapWidth - gridWidth) / 2);
    const gridY = heatmapTop + Math.floor((heatmapHeight - gridHeight) / 2);

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex += 1) {
      const date = new Date(gridStart.getTime() + dayIndex * dayMs);
      const dateStr = date.toISOString().split('T')[0];
      const level = dateMap.get(dateStr) ?? 0;
      const weekIndex = Math.floor(dayIndex / 7);
      const weekday = date.getUTCDay();
      const x = gridX + weekIndex * (blockSize + gap);
      const y = gridY + weekday * (blockSize + gap);
      ctx.fillStyle = heatmapColors[level] ?? heatmapColors[0];
      ctx.fillRect(x, y, blockSize, blockSize);
    }

    const footerY = innerY + innerH - 6;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px ui-sans-serif, system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Generated with Flickr Heatmap', innerX, footerY);
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'right';
    ctx.fillText(
      stats.peakDate ? `Peak date: ${stats.peakDate}` : 'Peak date: —',
      innerX + innerW,
      footerY
    );
    ctx.textAlign = 'left';

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${activeUsername}-${activeYear}-${activityMode}-flickr-heatmap.png`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const fetchActivity = async (mode: ActivityMode, targetUsername: string, year: number) => {
    const perPage = 500;
    let page = 1;
    let totalPages = 1;
    const allPhotos: PhotoRecord[] = [];

    setLoadingLabel(mode === 'taken' ? 'Loading photos...' : 'Loading uploads...');
    setProgress(0);

    do {
      const response = await fetch(
        `/api/photos?username=${encodeURIComponent(targetUsername)}&year=${year}&mode=${mode}&page=${page}&perPage=${perPage}`
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

    const filledData = fillYearData(aggregatePhotos(allPhotos, mode), year);

    return { data: filledData, totalPhotos: allPhotos.length };
  };

  const handleFetch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const targetUsername = inputUsername.trim();
    if (!targetUsername) {
      setError('Enter a Flickr username to continue.');
      return;
    }

    setLoading(true);
    setLoadingLabel('');
    setError(null);
    setUploadError(null);
    setData(null);
    setUploadData(null);
    setActivityMode('taken');

    try {
      const takenResult = await fetchActivity('taken', targetUsername, selectedYear);
      if (takenResult.totalPhotos === 0) {
        setError(`No photos taken found for ${selectedYear}. Try a previous year.`);
      }
      setData(takenResult.data);
      setInputUsername(targetUsername);
      setActiveUsername(targetUsername);
      setActiveYear(selectedYear);

      try {
        const uploadResult = await fetchActivity('upload', targetUsername, selectedYear);
        setUploadData(uploadResult.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to fetch upload activity';
        setUploadError(message);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
    } finally {
      setLoading(false);
      setProgress(0);
      setLoadingLabel('');
    }
  };

  const handleModeChange = (mode: ActivityMode) => {
    if (mode === activityMode) return;
    setActivityMode(mode);
  };

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
        <div className="flex items-center justify-end">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-100 transition hover:border-emerald-400/60 hover:bg-emerald-500/20"
            >
              <span className="max-w-[140px] truncate">
                {authenticatedUsername ?? 'Logged in'}
              </span>
              <span className="text-emerald-200/80">Log out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="inline-flex items-center rounded-full border border-slate-800/80 bg-slate-900/70 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-400/50 hover:text-white"
            >
              Log in with Flickr
            </button>
          )}
        </div>
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Flickr Heatmap</p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl md:text-6xl">
              See your photo days at a glance.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              Enter a Flickr username and year to generate a heatmap of when photos were taken or uploaded.
            </p>
          </div>

          <form
            onSubmit={handleFetch}
            className="space-y-5 rounded-3xl border border-slate-800/70 bg-slate-950/60 p-6 shadow-2xl glass-surface"
          >
            <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-2">
                <label htmlFor="flickr-username" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Flickr username or profile URL
                </label>
                <input
                  id="flickr-username"
                  type="text"
                  placeholder="nasahqphoto"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-base text-white placeholder:text-slate-600 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="flickr-year" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Year
                </label>
                <select
                  id="flickr-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 text-base text-white focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !inputUsername.trim()}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 px-4 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-900/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Generating heatmap...' : 'Generate heatmap'}
            </button>

            {loading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{loadingLabel || 'Loading...'}</span>
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

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </form>

          <div className="space-y-2 text-xs text-slate-500">
            <p>Example: nasahqphoto</p>
            <p>We only read your Flickr data for this request. No storage or ads.</p>
            <p>Private photos require login to include in results (top right).</p>
          </div>
        </motion.section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Results</p>
              <p className="text-lg font-semibold text-white">
                {activityMode === 'taken' ? 'Your photo activity' : 'Your upload activity'}
              </p>
            </div>
            {data && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <p>
                  {activeUsername} - {activeYear}
                </p>
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={!activeData}
                  className="rounded-full border border-slate-800/80 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-emerald-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Share image
                </button>
              </div>
            )}
          </div>

          {data && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full border border-slate-800/80 bg-slate-900/60 p-1 text-xs font-semibold text-slate-200">
                <button
                  type="button"
                  onClick={() => handleModeChange('taken')}
                  disabled={loading}
                  className={`rounded-full px-4 py-2 transition ${activityMode === 'taken'
                      ? 'bg-emerald-400/20 text-emerald-100'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Photos taken
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('upload')}
                  disabled={loading}
                  className={`rounded-full px-4 py-2 transition ${activityMode === 'upload'
                      ? 'bg-sky-400/20 text-sky-100'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Uploads
                </button>
              </div>
              {loading && (
                <span className="text-xs text-slate-500">{loadingLabel || 'Loading activity...'}</span>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {data ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                {activeData ? (
                  <Heatmap
                    data={activeData}
                    username={activeUsername}
                    yearLabel={activeYear.toString()}
                    activityLabel={activeLabel}
                    mode={activityMode}
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-800/70 bg-slate-900/40 p-8 text-center">
                    <p className="mx-auto max-w-2xl text-base text-slate-300">
                      {loading
                        ? 'Loading upload activity...'
                        : uploadError
                          ? `Uploads unavailable: ${uploadError}`
                          : 'Upload activity will appear here once loaded.'}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl border border-dashed border-slate-800/70 bg-slate-900/40 p-8 text-center"
              >
                <p className="mx-auto max-w-2xl text-base text-slate-300">
                  Results appear here after you generate a heatmap.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      <footer className="relative z-10 border-t border-slate-900/60 py-8 text-center text-xs text-slate-500">
        <p>Flickr Heatmap - built for photographers who love data.</p>
      </footer>
    </main>
  );
}
