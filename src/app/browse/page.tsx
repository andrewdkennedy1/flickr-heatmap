'use client';

import React, { useEffect, useState } from 'react';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Calendar, Search, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BrowsePage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [username, setUsername] = useState('');
    const [inputUsername, setInputUsername] = useState('');
    const [userInfo, setUserInfo] = useState<{
        userId: string;
        username: string;
        realname: string;
        earliestDate: string | null;
        avatar: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    const handleSearch = React.useCallback(async (e?: React.FormEvent, overrideUsername?: string) => {
        e?.preventDefault();
        const target = (overrideUsername || inputUsername).trim();
        if (!target) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/user?username=${encodeURIComponent(target)}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Failed to find user');

            setUserInfo(data);
            setUsername(data.username);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to find user';
            setError(message);
            setUserInfo(null);
        } finally {
            setLoading(false);
        }
    }, [inputUsername]);

    useEffect(() => {
        setMounted(true);
        const flickrUsername = document.cookie
            .split('; ')
            .find((row) => row.startsWith('flickr_username='))
            ?.split('=')[1];

        if (flickrUsername) {
            const decoded = decodeURIComponent(flickrUsername);
            setInputUsername(decoded);
            handleSearch(null, decoded);
        }
    }, [handleSearch]);

    if (!mounted) return null;

    return (
        <main className="relative min-h-screen overflow-hidden bg-[#020617] text-slate-100">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent" />

            <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
                {/* Navigation Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/"
                        className="group flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        Back to Heatmap
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="hidden rounded-full border border-slate-800 bg-slate-900/50 p-1 sm:flex">
                            <Link href="/" className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-200">
                                <Map size={14} /> Heatmap
                            </Link>
                            <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-medium text-emerald-100">
                                <Calendar size={14} /> Browse
                            </div>
                        </div>
                    </div>
                </div>

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/80">Navigation</p>
                        <h1 className="text-4xl font-bold text-white sm:text-5xl">Browse Archives</h1>
                        <p className="max-w-2xl text-lg text-slate-400">
                            A better way to explore your Flickr history. Select a month to see every photo you took.
                        </p>
                    </div>
                </motion.section>

                {/* User Search / Selection */}
                {!userInfo || userInfo.username !== inputUsername ? (
                    <form
                        onSubmit={handleSearch}
                        className="relative flex max-w-xl items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-2 glass-surface"
                    >
                        <Search className="ml-3 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Flickr username or URL..."
                            value={inputUsername}
                            onChange={(e) => setInputUsername(e.target.value)}
                            className="flex-1 bg-transparent py-2 text-white placeholder-slate-600 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
                        </button>
                    </form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"
                    >
/* eslint-disable @next/next/no-img-element */
                        <img
                            src={userInfo.avatar}
                            alt={userInfo.username}
                            className="h-12 w-12 rounded-full border border-emerald-500/30 bg-slate-800"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://www.flickr.com/images/buddyicon.gif`;
                            }}
                        />
                        <div className="flex-1">
                            <h3 className="font-semibold text-white">{userInfo.realname || userInfo.username}</h3>
                            <p className="text-xs text-slate-500">@{userInfo.username}</p>
                        </div>
                        <button
                            onClick={() => setUserInfo(null)}
                            className="text-xs text-slate-500 hover:text-white"
                        >
                            Change User
                        </button>
                    </motion.div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {userInfo && (
                        <motion.div
                            key={userInfo.userId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <MonthlyCalendar
                                userId={userInfo.userId}
                                earliestDate={userInfo.earliestDate}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
