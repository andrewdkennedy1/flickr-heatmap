import { NextRequest, NextResponse } from 'next/server';
import { FlickrService } from '@/lib/flickr';

export async function GET(request: NextRequest): Promise<Response> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const apiKey = process.env.NEXT_PUBLIC_FLICKR_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        // Get OAuth tokens from httpOnly cookies (only accessible server-side)
        const accessToken = request.cookies.get('flickr_access_token')?.value;
        const accessTokenSecret = request.cookies.get('flickr_access_token_secret')?.value;

        const service = new FlickrService(apiKey, accessToken, accessTokenSecret);

        // Find user ID
        let userId: string;
        if (username.startsWith('http')) {
            userId = await service.findUserByUrl(username);
        } else {
            userId = await service.findUserByUsername(username);
        }

        // Fetch photos from the last year
        const lastYear = new Date();
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        const minDate = Math.floor(lastYear.getTime() / 1000).toString();

        const photos = await service.getUserPhotos(userId, minDate);
        const activityData = FlickrService.aggregatePhotoData(photos);

        return NextResponse.json({
            success: true,
            authenticated: !!(accessToken && accessTokenSecret),
            data: activityData,
            totalPhotos: photos.length,
        });
    } catch (error: unknown) {
        console.error('Photos API error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch photos';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
