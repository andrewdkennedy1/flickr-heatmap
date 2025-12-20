'use client';

import React, { useRef, useState } from 'react';
import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import { ActivityData } from '@/lib/flickr';

interface HeatmapProps {
  data: ActivityData[];
  userId: string;
  yearLabel: string;
  activityLabel: string;
  mode: 'taken' | 'upload';
}

const theme: ThemeInput = {
  light: [
    '#ebedf0', // 0
    '#f0fff4', // 1
    '#dcfce7', // 2
    '#bbf7d0', // 3
    '#86efac', // 4
    '#4ade80', // 5
    '#22c55e', // 6
    '#16a34a', // 7
  ],
  dark: [
    '#0b1120', // 0: Empty
    '#064e3b', // 1: Very Dark Emerald
    '#065f46', // 2: Dark Emerald
    '#047857', // 3: Emerald
    '#059669', // 4: Light Emerald
    '#10b981', // 5
    '#34d399', // 6
    '#6ee7b7', // 7: Brightest
  ],
};

export const Heatmap: React.FC<HeatmapProps> = ({ data, userId, yearLabel, activityLabel, mode }) => {
  const [activeDay, setActiveDay] = useState<ActivityData | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const holdActiveRef = useRef(false);
  const pointerDownRef = useRef(false);
  const suppressClickRef = useRef(false);

  const totalPhotos = data.reduce((acc, curr) => acc + curr.count, 0);
  const activeDays = data.filter((day) => day.count > 0).length;
  // ... (keep existing stats logic)
  const peakDay = data.reduce<ActivityData | null>((acc, entry) => {
    if (entry.count <= 0) return acc;
    if (!acc || entry.count > acc.count) return entry;
    return acc;
  }, null);
  const peakCount = peakDay?.count ?? 0;
  const peakDate = peakDay?.date ?? null;
  const longestStreak = data
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
  data.forEach((entry) => {
    const monthIndex = Number.parseInt(entry.date.slice(5, 7), 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      monthTotals[monthIndex] += entry.count;
    }
  });
  const busiestMonthIndex = monthTotals.reduce((best, value, index) => {
    if (value > monthTotals[best]) return index;
    return best;
  }, 0);
  const yearNumber = Number.parseInt(yearLabel, 10);
  const monthLabelBaseYear = Number.isFinite(yearNumber) ? yearNumber : new Date().getFullYear();
  const hasData = totalPhotos > 0;
  const busiestMonthLabel = hasData
    ? new Date(Date.UTC(monthLabelBaseYear, busiestMonthIndex, 1)).toLocaleString('en-US', {
      month: 'short',
    })
    : '—';
  const totalLabel = activityLabel === 'uploads' ? 'Total uploads' : 'Total photos';
  const activeDaysHint = activityLabel === 'uploads' ? 'days with uploads' : 'days with photos';
  const busiestHint = activityLabel === 'uploads' ? 'most uploads' : 'most photos';

  const buildSearchUrl = (date: string) => {
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(`${date}T23:59:59Z`);
    const minUnix = Math.floor(startOfDay.getTime() / 1000);
    const maxUnix = Math.floor(endOfDay.getTime() / 1000);

    const sort = mode === 'upload' ? 'date-posted-desc' : 'date-taken-desc';
    const dateParam = mode === 'upload' ? 'upload_date' : 'taken_date';

    return `https://www.flickr.com/search/?user_id=${encodeURIComponent(userId)}&sort=${sort}&min_${dateParam}=${minUnix}&max_${dateParam}=${maxUnix}&view_all=1`;
  };

  const formatDayLabel = (activity: ActivityData) =>
    new Date(activity.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const clearHoldTimer = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handlePointerDown = (activity: ActivityData, event: React.PointerEvent<SVGRectElement>) => {
    pointerDownRef.current = true;
    clearHoldTimer();

    if (event.pointerType === 'mouse') {
      setActiveDay(activity);
      return;
    }

    holdTimerRef.current = window.setTimeout(() => {
      holdActiveRef.current = true;
      setActiveDay(activity);
    }, 250);
  };

  const handlePointerMove = (activity: ActivityData, event: React.PointerEvent<SVGRectElement>) => {
    if (event.pointerType === 'mouse' || holdActiveRef.current) {
      setActiveDay(activity);
    }
  };

  const handlePointerUp = () => {
    if (holdActiveRef.current) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 300);
    }
    pointerDownRef.current = false;
    holdActiveRef.current = false;
    clearHoldTimer();
  };

  const handlePointerLeave = () => {
    if (!pointerDownRef.current) {
      setActiveDay(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl glass-surface">
      <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-5">
        <div className="space-y-1 text-sm text-slate-400">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Heatmap</p>
          <p>Every square represents a day in {yearLabel}.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: totalLabel,
              value: totalPhotos.toLocaleString(),
              hint: activityLabel,
              accent: 'text-emerald-200',
            },
            {
              label: 'Active days',
              value: activeDays.toLocaleString(),
              hint: activeDaysHint,
              accent: 'text-sky-200',
            },
            {
              label: 'Peak count',
              value: peakCount.toLocaleString(),
              hint: peakDate ? `Peak date ${peakDate}` : 'No peak yet',
              accent: 'text-amber-200',
            },
            {
              label: 'Longest streak',
              value: hasData ? `${longestStreak} days` : '—',
              hint: 'consecutive days',
              accent: 'text-teal-200',
            },
            {
              label: 'Busiest month',
              value: busiestMonthLabel,
              hint: hasData ? busiestHint : 'No data yet',
              accent: 'text-rose-200',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${stat.accent}`}>{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
          <ActivityCalendar
            data={data}
            theme={theme}
            maxLevel={7}
            colorScheme="dark"
            labels={{ totalCount: `{{count}} ${activityLabel} in ${yearLabel}` }}
            renderBlock={(block, activity) => {
              const enhancedBlock = React.cloneElement(block, {
                onPointerDown: (event: React.PointerEvent<SVGRectElement>) =>
                  handlePointerDown(activity as ActivityData, event),
                onPointerMove: (event: React.PointerEvent<SVGRectElement>) =>
                  handlePointerMove(activity as ActivityData, event),
                onPointerUp: handlePointerUp,
                onPointerLeave: handlePointerLeave,
                onPointerCancel: handlePointerUp,
                style: { ...block.props.style, cursor: 'pointer' },
              });

              return (
                <a
                  href={buildSearchUrl(activity.date)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`View photos from ${activity.date}`}
                  onClick={(event) => {
                    if (suppressClickRef.current) {
                      event.preventDefault();
                    }
                  }}
                >
                  {enhancedBlock}
                </a>
              );
            }}
            blockSize={12}
            blockMargin={4}
            fontSize={14}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/70 px-3 py-2">
            <span className="text-slate-500">Less</span>
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded-sm bg-[#0b1120]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#064e3b]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#065f46]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#047857]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#059669]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#10b981]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#34d399]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#6ee7b7]"></div>
            </div>
            <span className="text-slate-500">More</span>
          </div>

          <ShareButton
            username={userId}
            data={data}
            year={yearLabel}
            activityType={activityLabel === 'uploads' ? 'uploaded' : 'taken'}
          />

          {activeDay ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200">
              <span className="font-semibold text-emerald-300">{formatDayLabel(activeDay)}</span>
              <span>· {activeDay.count} photos</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Tip: press and drag on desktop or tap and hold on mobile to see each day&apos;s exact count.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const ShareButton: React.FC<{
  username: string;
  data: ActivityData[];
  year: string;
  activityType: 'uploaded' | 'taken';
}> = ({ username, data, year, activityType }) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, data, year, activityType }),
      });

      if (!response.ok) throw new Error('Failed to save snapshot');

      const url = `${window.location.origin}/${username}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Share failed', error);
      alert('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="ml-auto flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
    >
      {loading ? (
        <span className="animate-pulse">Saving...</span>
      ) : copied ? (
        <span className="text-emerald-400">Copied Link!</span>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" x2="12" y1="2" y2="15" />
          </svg>
          Share Snapshot
        </>
      )}
    </button>
  );
};
