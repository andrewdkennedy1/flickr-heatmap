'use client';

import React from 'react';
import { ActivityCalendar, ThemeInput } from 'react-activity-calendar';
import { ActivityData } from '@/lib/flickr';

interface HeatmapProps {
    data: ActivityData[];
    username: string;
}

const theme: ThemeInput = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
};

export const Heatmap: React.FC<HeatmapProps> = ({ data, username }) => {
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
                        totalCount: '{{count}} photos in the last year',
                    }}
                    blockSize={12}
                    blockMargin={4}
                    fontSize={14}
                />
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
