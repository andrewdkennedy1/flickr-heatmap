/* eslint-disable react/no-unstable-nested-components */
'use client';

import React, { useRef, useState } from 'react';
import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import { ActivityData } from '@/lib/flickr';

interface HeatmapProps {
    data: ActivityData[];
    username: string;
    yearLabel: string;
}

const theme: ThemeInput = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
};

export const Heatmap: React.FC<HeatmapProps> = ({ data, username, yearLabel }) => {
    const [activeDay, setActiveDay] = useState<ActivityData | null>(null);
    const holdTimerRef = useRef<number | null>(null);
    const holdActiveRef = useRef(false);
    const pointerDownRef = useRef(false);
    const suppressClickRef = useRef(false);

    const basePhotostreamUrl = username.startsWith('http')
        ? username
        : `https://www.flickr.com/photos/${encodeURIComponent(username)}/`;

    const buildPhotostreamUrl = (date: string) => {
        const separator = basePhotostreamUrl.includes('?') ? '&' : '?';
        return `${basePhotostreamUrl}${separator}date=${date}`;
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
        <div className="flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl animate-in fade-in transition-all duration-500">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                {`${username}'s Flickr Activity`}
            </h2>
            <div className="overflow-x-auto w-full flex justify-center py-4">
                <ActivityCalendar
                    data={data}
                    theme={theme}
                    colorScheme="dark"
                    labels={{
                        totalCount: `{{count}} photos in ${yearLabel}`,
                    }}
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
                                href={buildPhotostreamUrl(activity.date)}
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
            <div className="mt-2 text-sm text-gray-300">
                {activeDay ? (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-emerald-300">
                            {formatDayLabel(activeDay)}
                        </span>
                        <span>· {activeDay.count} photos</span>
                        <a
                            href={buildPhotostreamUrl(activeDay.date)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                        >
                            Open photostream
                        </a>
                    </div>
                ) : (
                    <span className="text-gray-500">
                        Press and drag or tap and hold a day to see exact counts.
                    </span>
                )}
            </div>
            <div className="mt-6 flex gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 bg-[#161b22] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#0e4429] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#006d32] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#26a641] rounded-sm"></div>
                        <div className="w-3 h-3 bg-[#39d353] rounded-sm"></div>
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};
