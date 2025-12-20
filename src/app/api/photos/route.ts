import { NextRequest, NextResponse } from 'next/server';
import { FlickrService } from '@/lib/flickr';

export async function GET(request: NextRequest): Promise<Response> {
    try {
        const searchParams = request.nextUrl.searchParams;
        const username = searchParams.get('username');
        const modeParam = searchParams.get('mode');
        const mode = modeParam === 'upload' ? 'upload' : 'taken';

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

        const yearParam = searchParams.get('year');
        let minUploadDate: string | undefined;
        let maxUploadDate: string | undefined;
        let minTakenDate: string | undefined;
        let maxTakenDate: string | undefined;

        if (yearParam) {
            const parsedYear = Number.parseInt(yearParam, 10);
            const currentYear = new Date().getFullYear();
            if (!Number.isFinite(parsedYear) || parsedYear < 2004 || parsedYear > currentYear) {
                return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
            }

            if (mode === 'taken') {
                const startDate = `${parsedYear}-01-01`;
                const endDate =
                    parsedYear === currentYear
                        ? new Date().toISOString().split('T')[0]
                        : `${parsedYear}-12-31`;
                minTakenDate = startDate;
                maxTakenDate = endDate;
            } else {
                const start = new Date(Date.UTC(parsedYear, 0, 1, 0, 0, 0));
                const end =
                    parsedYear === currentYear
                        ? new Date()
                        : new Date(Date.UTC(parsedYear + 1, 0, 1, 0, 0, 0) - 1);
                minUploadDate = Math.floor(start.getTime() / 1000).toString();
                maxUploadDate = Math.floor(end.getTime() / 1000).toString();
            }
        } else {
            const lastYear = new Date();
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            minUploadDate = Math.floor(lastYear.getTime() / 1000).toString();
        }

        const pageParam = searchParams.get('page');
        const perPageParam = searchParams.get('perPage');

        if (pageParam) {
            const page = Number.parseInt(pageParam, 10);
            const perPage = perPageParam ? Number.parseInt(perPageParam, 10) : 500;

            if (!Number.isFinite(page) || page < 1) {
                return NextResponse.json({ error: 'Invalid page' }, { status: 400 });
            }

            const safePerPage = Number.isFinite(perPage) && perPage > 0 ? Math.min(perPage, 500) : 500;
            const result = await service.getUserPhotosPage(userId, page, safePerPage, {
                minUploadDate,
                maxUploadDate,
                minTakenDate,
                maxTakenDate,
            });

            return NextResponse.json({
                success: true,
                authenticated: !!(accessToken && accessTokenSecret),
                page,
                totalPages: result.totalPages,
                photos: result.photos,
            });
        }

        const photos = await service.getUserPhotos(userId, {
            minUploadDate,
            maxUploadDate,
            minTakenDate,
            maxTakenDate,
        });
        const activityData = FlickrService.aggregatePhotoData(photos, mode);

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
