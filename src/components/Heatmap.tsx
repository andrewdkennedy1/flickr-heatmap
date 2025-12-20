'use client';

import React from 'react';
import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import { ActivityData } from '@/lib/flickr';
import { CalendarRange, Flame, Sparkles } from 'lucide-react';

interface HeatmapProps {
  data: ActivityData[];
  username: string;
}

const theme: ThemeInput = {
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  dark: ['#0b1120', '#0e4429', '#047857', '#14b8a6', '#34d399'],
};

export const Heatmap: React.FC<HeatmapProps> = ({ data, username }) => {
  const totalUploads = data.reduce((acc, curr) => acc + curr.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;
  const peakDayCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-2xl glass-surface">
      <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">Activity heatmap</p>
            <h2 className="text-3xl font-bold text-white text-glow">{username}&apos;s uploads</h2>
            <p className="text-sm text-slate-400">
              Every square below represents a day of uploads from the last 12 months.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 frosted-border">
              <Sparkles size={16} className="text-emerald-300" />
              <span className="font-semibold text-white">{totalUploads.toLocaleString()}</span>
              <span className="text-slate-400">uploads</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-2 frosted-border">
              <CalendarRange size={16} className="text-blue-300" />
              <span className="font-semibold text-white">{activeDays}</span>
              <span className="text-slate-400">active days</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 frosted-border">
              <Flame size={16} className="text-amber-300" />
              <span className="font-semibold text-white">{peakDayCount}</span>
              <span className="text-slate-400">peak day</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/60 bg-slate-950/40 p-4">
          <ActivityCalendar
            data={data}
            theme={theme}
            colorScheme="dark"
            labels={{ totalCount: '{{count}} photos in the last year' }}
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
              <div className="h-3 w-3 rounded-sm bg-[#0e4429]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#047857]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#14b8a6]"></div>
              <div className="h-3 w-3 rounded-sm bg-[#34d399]"></div>
            </div>
            <span className="text-slate-500">More</span>
          </div>
          <p className="text-xs text-slate-500">
            Tip: press and drag on desktop or tap and hold on mobile to see each day&apos;s exact count.
          </p>
        </div>
      </div>
    </div>
  );
};
