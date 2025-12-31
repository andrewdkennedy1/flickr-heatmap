'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface MonthlyCalendarProps {
    userId: string;
    earliestDate: string | null;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ userId, earliestDate }) => {
    const currentYear = new Date().getFullYear();
    const startYear = earliestDate ? new Date(earliestDate).getFullYear() : 2004;
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [monthlyCounts, setMonthlyCounts] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const years = Array.from(
        { length: currentYear - startYear + 1 },
        (_, i) => currentYear - i
    );

    React.useEffect(() => {
        const fetchCounts = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/user/activity?userId=${userId}&year=${selectedYear}`);
                const data = await response.json();
                if (data.success) {
                    setMonthlyCounts(data.counts);
                }
            } catch (error) {
                console.error('Failed to fetch monthly counts:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCounts();
    }, [userId, selectedYear]);

    const getFlickrUrl = (year: number, monthIndex: number) => {
        const startOfMonth = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
        const endOfMonth = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0) - 1000);

        const minUnix = Math.floor(startOfMonth.getTime() / 1000);
        const maxUnix = Math.floor(endOfMonth.getTime() / 1000);

        return `https://www.flickr.com/search/?user_id=${encodeURIComponent(userId)}&sort=date-taken-desc&min_taken_date=${minUnix}&max_taken_date=${maxUnix}&view_all=1`;
    };

    const isMonthFuture = (year: number, monthIndex: number) => {
        const now = new Date();
        return year > now.getFullYear() || (year === now.getFullYear() && monthIndex > now.getMonth());
    };

    const isMonthBeforeEarliest = (year: number, monthIndex: number) => {
        if (!earliestDate) return false;
        const earliest = new Date(earliestDate);
        return year < earliest.getFullYear() || (year === earliest.getFullYear() && monthIndex < earliest.getMonth());
    };

    const isMonthEmpty = (monthIndex: number) => {
        if (loading) return false;
        return monthlyCounts[monthIndex] === 0;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-white">Select a month</h2>
                    <p className="text-sm text-slate-400">Jump to your Flickr archives for {selectedYear}</p>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-white focus:border-emerald-400 focus:outline-none"
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedYear(prev => Math.min(currentYear, prev + 1))}
                            disabled={selectedYear === currentYear}
                            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200 transition hover:bg-slate-800 hover:text-white disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setSelectedYear(prev => Math.max(startYear, prev - 1))}
                            disabled={selectedYear === startYear}
                            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-200 transition hover:bg-slate-800 hover:text-white disabled:opacity-30"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <motion.div
                layout
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
            >
                <AnimatePresence mode="popLayout">
                    {MONTHS.map((month, index) => {
                        const outOfRange = isMonthFuture(selectedYear, index) || isMonthBeforeEarliest(selectedYear, index);
                        const empty = isMonthEmpty(index);
                        const disabled = outOfRange || empty;
                        const count = monthlyCounts[index];

                        return (
                            <motion.a
                                key={`${selectedYear}-${month}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2, delay: index * 0.02 }}
                                href={disabled ? undefined : getFlickrUrl(selectedYear, index)}
                                target="_blank"
                                rel="noreferrer"
                                className={`group relative overflow-hidden rounded-2xl border p-6 transition-all ${disabled
                                        ? 'border-slate-900 bg-slate-950/20 opacity-40 cursor-not-allowed grayscale'
                                        : 'border-slate-800 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                                    }`}
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-semibold uppercase tracking-wider ${disabled ? 'text-slate-600' : 'text-emerald-400 group-hover:text-emerald-300'}`}>
                                            {selectedYear}
                                        </span>
                                        {!disabled && count !== undefined && (
                                            <span className="text-[10px] text-slate-500">{count} photos</span>
                                        )}
                                    </div>
                                    <span className={`text-xl font-bold ${disabled ? 'text-slate-700' : 'text-white'}`}>
                                        {month}
                                    </span>
                                    {empty && !outOfRange && (
                                        <span className="text-[10px] text-slate-600">No photos</span>
                                    )}
                                </div>

                                {!disabled && (
                                    <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                                        <ExternalLink size={16} className="text-emerald-400" />
                                    </div>
                                )}

                                <div className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/10" />
                            </motion.a>
                        );
                    })}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
