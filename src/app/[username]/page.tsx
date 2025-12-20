import React from 'react';
import { notFound } from 'next/navigation';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Heatmap } from '@/components/Heatmap';
import { ActivityData } from '@/lib/flickr';

interface PageProps {
    params: Promise<{
        username: string;
    }>;
}

interface SnapshotData {
    username: string;
    data: ActivityData[];
    year: string;
    activityType: 'uploaded' | 'taken';
    timestamp: number;
}

export const runtime = 'edge';

async function getSnapshot(username: string): Promise<SnapshotData | null> {
    const { env } = await getCloudflareContext();

    if (!env.SNAPSHOT_SERVICE) {
        console.error("SNAPSHOT_SERVICE binding not found");
        return null;
    }

    try {
        const response = await env.SNAPSHOT_SERVICE.fetch(
            `http://internal/${username}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }
        );

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch snapshot: ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error fetching snapshot:", error);
        return null;
    }
}

export default async function SharedHeatmapPage({ params }: PageProps) {
    const { username } = await params;
    const snapshot = await getSnapshot(username);

    if (!snapshot) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-[#0b1120] text-slate-200 p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-5xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        {snapshot.username}&apos;s {snapshot.year} Heatmap
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Snapshot generated on {new Date(snapshot.timestamp).toLocaleDateString()}
                    </p>
                </div>

                <Heatmap
                    data={snapshot.data}
                    userId={snapshot.username} // Using username as ID for display/search purposes mostly
                    yearLabel={snapshot.year}
                    activityLabel={snapshot.activityType === 'uploaded' ? 'uploads' : 'photos'}
                    mode={snapshot.activityType === 'uploaded' ? 'upload' : 'taken'}
                />

                <div className="text-center">
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        ← Create your own heatmap
                    </a>
                </div>
            </div>
        </div>
    );
}
