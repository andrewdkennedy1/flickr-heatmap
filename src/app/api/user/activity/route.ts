import { NextRequest, NextResponse } from 'next/server';
import { FlickrService } from '@/lib/flickr';

export async function GET(request: NextRequest): Promise<Response> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');
        const yearParam = searchParams.get('year');
        const modeParam = searchParams.get('mode');
        const mode = modeParam === 'upload' ? 'upload' : 'taken';

        if (!userId || !yearParam) {
            return NextResponse.json({ error: 'userId and year are required' }, { status: 400 });
        }

        const year = parseInt(yearParam, 10);
        if (isNaN(year)) {
            return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
        }

        const apiKey = process.env.NEXT_PUBLIC_FLICKR_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const accessToken = request.cookies.get('flickr_access_token')?.value;
        const accessTokenSecret = request.cookies.get('flickr_access_token_secret')?.value;

        const service = new FlickrService(apiKey, accessToken, accessTokenSecret);
        const counts = await service.getMonthlyCounts(userId, year, mode);

        return NextResponse.json({
            success: true,
            year,
            counts
        });
    } catch (error: unknown) {
        console.error('Activity API error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch activity counts';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
